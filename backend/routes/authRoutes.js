const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
router.get('/ping', auth, (req, res) => res.json({ ok: true }));

const generateToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// User response ko ek jagah handle karenge
const formatUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  authProvider: user.authProvider,
  role: user.role || 'user',
  encryptionSalt: user.encryptionSalt,
  profileImageUrl: user.profileImageUrl || '',

  // Cloudinary connection status
  cloudinaryConnected: Boolean(user.cloudinaryConnected),
  cloudinaryCloudName: user.cloudinaryCloudName || '',
  cloudName: user.cloudName || '',
  uploadPreset: user.uploadPreset || '',
  cloudinaryConnectedAt:
    user.cloudinaryConnectedAt || null,
});

function getProfileImagesBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'profileImages',
  });
}

function buildProfileImageUrl(req, fileId) {
  return `${req.protocol}://${req.get('host')}/api/auth/profile-images/${fileId}`;
}

// ================= EMAIL AUTH =================

const validateEmailFormat = emailStr => {
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(
    String(emailStr).toLowerCase().trim(),
  );
};

const normalizePhoneNumber = phoneStr => {
  const digits = String(phoneStr).replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('03')) {
    return '+92' + digits.slice(1);
  }

  if (digits.length === 10 && digits.startsWith('3')) {
    return '+92' + digits;
  }

  if (digits.length === 12 && digits.startsWith('923')) {
    return '+' + digits;
  }

  if (digits.length >= 10 && digits.length <= 14) {
    return '+' + digits;
  }

  return null;
};

// ================= REGISTER =================

const handleRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      phoneNumber,
      password,
    } = req.body;

    const phoneNum = phone || phoneNumber;

    if (!name || (!email && !phoneNum) || !password) {
      return res.status(400).json({
        message:
          'Please provide name, email or phone number, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters long',
      });
    }

    const userData = {
      name: name.trim(),
      password: await bcrypt.hash(
        password,
        await bcrypt.genSalt(10),
      ),
      authProvider: email ? 'email' : 'phone',

      // New account starts without Cloudinary
      cloudinaryConnected: false,
      cloudinaryCloudName: '',
      cloudName: '',
      cloudinaryConnectedAt: null,
      // Registration creates an authenticated account, so establish the same
      // timestamp used for successful sign-ins from the outset.
      lastLoginAt: new Date(),
      isActive: true,
    };

    // EMAIL
    if (email && email.trim() !== '') {
      const normalizedEmail = email
        .toLowerCase()
        .trim();

      if (!validateEmailFormat(normalizedEmail)) {
        return res.status(400).json({
          message:
            'Please provide a valid email address (e.g., user@example.com)',
        });
      }

      const existingEmail = await User.findOne({
        email: normalizedEmail,
      });

      if (existingEmail) {
        return res.status(400).json({
          message:
            'A user with this email already exists',
        });
      }

      userData.email = normalizedEmail;

      // Admin email se register karne wale user ko automatically
      // admin role de do, taake Chat with Admin feature kaam kare.
      const configuredAdminEmail = String(process.env.ADMIN_EMAIL || 'dadajackie3@gmail.com').trim().toLowerCase();
      if (normalizedEmail === configuredAdminEmail) {
        userData.role = 'admin';
      }
    }

    // PHONE
    if (phoneNum && phoneNum.trim() !== '') {
      const normalizedPhone =
        normalizePhoneNumber(phoneNum);

      if (!normalizedPhone) {
        return res.status(400).json({
          message:
            'Please provide a valid 11-digit Pakistani phone number (e.g., 03001234567)',
        });
      }

      const existingPhone = await User.findOne({
        phoneNumber: normalizedPhone,
      });

      if (existingPhone) {
        return res.status(400).json({
          message:
            'A user with this phone number already exists',
        });
      }

      userData.phoneNumber = normalizedPhone;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Error in register:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        message:
          'User already exists with this email or phone number',
      });
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(
        err.errors,
      ).map(e => e.message);

      return res.status(400).json({
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      message:
        err.message ||
        'Server error during registration',
    });
  }
};

router.post('/register', handleRegister);
router.post('/email-register', handleRegister);

// ================= LOGIN =================

const handleLogin = async (req, res) => {
  try {
    const {
      email,
      phone,
      phoneNumber,
      identifier,
      password,
    } = req.body;

    const loginIdentifier = (
      email ||
      phone ||
      phoneNumber ||
      identifier ||
      ''
    ).trim();

    const isEmail =
      loginIdentifier.includes('@');

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: isEmail
          ? 'Please enter your email and password'
          : 'Please enter your phone number and password',
      });
    }

    const normalizedIdentifier = isEmail
      ? loginIdentifier.toLowerCase()
      : normalizePhoneNumber(loginIdentifier);

    if (!normalizedIdentifier) {
      return res.status(400).json({
        message:
          'Please enter a valid phone number',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phoneNumber: normalizedIdentifier },
      ],
    });

    if (!user) {
      return res.status(400).json({
        message: isEmail
          ? 'Incorrect email address or password'
          : 'Incorrect phone number or password',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          'This account does not have a password. Use the supported sign-in method.',
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isMatch) {
      return res.status(400).json({
        message: isEmail
          ? 'Incorrect password or email address'
          : 'Incorrect password or phone number',
      });
    }

    // A successful password check is the only normal login path that updates
    // this timestamp. It also safely reactivates a previously deactivated user.
    user.lastLoginAt = new Date();
    user.isActive = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Error in login:', err);

    res.status(500).json({
      message:
        err.message ||
        'Server error during login',
    });
  }
};

router.post('/login', handleLogin);
router.post('/email-login', handleLogin);

// ================= USER PROFILE =================

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: formatUser(req.user),
    });
  } catch (err) {
    console.error(
      '❌ Error in /me:',
      err,
    );

    res.status(500).json({
      message:
        err.message ||
        'Server error fetching user profile',
    });
  }
});

router.get('/profile-images/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    const _id = new mongoose.Types.ObjectId(fileId);
    const bucket = getProfileImagesBucket();
    const file = await bucket.find({ _id }).next();
    if (!file) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    if (file.contentType) res.set('Content-Type', file.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    return bucket.openDownloadStream(_id).on('error', next).pipe(res);
  } catch (err) {
    return next(err);
  }
});

router.post('/profile-image', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer?.length || !String(req.file.mimetype || '').startsWith('image/')) {
      return res.status(400).json({ message: 'A profile image file is required.' });
    }

    const bucket = getProfileImagesBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname || `profile-${req.user._id}.jpg`, {
      contentType: req.file.mimetype || 'image/jpeg',
      metadata: { userId: req.user._id },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.end(req.file.buffer);
    });

    const previousFileId = req.user.profileImageFileId;
    const profileImageUrl = buildProfileImageUrl(req, uploadStream.id);
    req.user.profileImageUrl = profileImageUrl;
    req.user.profileImageFileId = uploadStream.id;
    await req.user.save();
    if (previousFileId) {
      bucket.delete(previousFileId).catch(() => {});
    }

    const io = req.app.get('io');
    const event = {
      userId: String(req.user._id),
      profileImageUrl: req.user.profileImageUrl || '',
      user: formatUser(req.user),
    };
    io?.to(`user:${String(req.user._id)}`).emit('profile:image-updated', event);
    io?.emit('user:profile-updated', event);

    res.json({ user: formatUser(req.user) });
  } catch (err) {
    console.error('Error updating profile image:', err);
    res.status(500).json({ message: err.message || 'Could not update profile image' });
  }
});

// ================= CLOUDINARY CONNECTION =================

// OAuth successfully hone ke BAAD frontend
// is endpoint ko call karega.
//
// IMPORTANT:
// Hum Cloudinary OAuth access token MongoDB me
// save nahi kar rahe.
// Sirf connection information save hogi.

router.put(
  '/cloudinary-connection',
  auth,
  async (req, res) => {
    try {
      const cloudName = String(
        req.body.cloudName || '',
      ).trim();
      const uploadPreset = String(req.body.uploadPreset || '').trim();

      if (!cloudName || !uploadPreset) {
        return res.status(400).json({
          message:
            'Cloudinary Cloud Name is required',
        });
      }

      if (req.user.cloudName || req.user.uploadPreset) {
        const sameConnection =
          req.user.cloudName === cloudName &&
          req.user.uploadPreset === uploadPreset;

        if (!sameConnection) {
          return res.status(409).json({
            message:
              'Cloud storage is already permanently linked to this account.',
          });
        }

        return res.json({
          message:
            'Cloudinary already connected',
          user: formatUser(req.user),
        });
      }

      const owner = await User.findOne({ cloudName, _id: { $ne: req.user._id } }).select('_id');
      if (owner) return res.status(409).json({ message: 'This Cloudinary Cloud Name is already connected to another Medi user.' });

      req.user.cloudinaryConnected = true;
      req.user.cloudinaryCloudName =
        cloudName;
      req.user.cloudName = cloudName;
      req.user.uploadPreset = uploadPreset;

      req.user.cloudinaryConnectedAt =
        new Date();

      await req.user.save();

      console.log(
        `✅ Cloudinary connected for Medi user ${req.user._id}`,
      );

      res.json({
        message:
          'Cloudinary connected successfully',
        user: formatUser(req.user),
      });
    } catch (err) {
      console.error(
        '❌ Cloudinary connection save failed:',
        err,
      );

      res.status(500).json({
        message:
          err.message ||
          'Could not save Cloudinary connection',
      });
    }
  },
);

// User apna Cloudinary disconnect bhi kar sake
router.delete(
  '/cloudinary-connection',
  auth,
  async (req, res) => {
    try {
      res.status(403).json({
        message:
          'Cloud storage is permanently linked to this account.',
      });
    } catch (err) {
      console.error(
        '❌ Cloudinary disconnect failed:',
        err,
      );

      res.status(500).json({
        message:
          err.message ||
          'Could not disconnect Cloudinary',
      });
    }
  },
);

module.exports = router;
