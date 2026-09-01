const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const generateToken = userId => {
  const secret =
    process.env.JWT_SECRET ||
    'default_jwt_secret_key_change_in_production';

  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });
};

// User response ko ek jagah handle karenge
const formatUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  authProvider: user.authProvider,

  // Cloudinary connection status
  cloudinaryConnected: Boolean(user.cloudinaryConnected),
  cloudinaryCloudName: user.cloudinaryCloudName || '',
  cloudinaryConnectedAt:
    user.cloudinaryConnectedAt || null,
});

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
      cloudinaryConnectedAt: null,
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
          'This account was created with Truecaller.',
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

// ================= TRUECALLER AUTH =================

router.post(
  '/truecaller-login',
  async (req, res) => {
    try {
      const { payload, profile } = req.body;

      let phoneNumber = '';
      let name = '';
      let truecallerId = '';
      let email = '';

      if (profile) {
        phoneNumber =
          profile.phoneNumber ||
          profile.phone ||
          '';

        name =
          profile.name ||
          `${profile.firstName || ''} ${profile.lastName || ''
            }`.trim() ||
          'Truecaller User';

        email = profile.email || '';

        truecallerId =
          profile.id ||
          profile.truecallerId ||
          '';
      } else if (payload) {
        try {
          const parsed =
            typeof payload === 'string'
              ? JSON.parse(payload)
              : payload;

          phoneNumber =
            parsed.phoneNumber ||
            parsed.phone ||
            '';

          name =
            parsed.name ||
            `${parsed.firstName || ''} ${parsed.lastName || ''
              }`.trim() ||
            'Truecaller User';

          email = parsed.email || '';

          truecallerId =
            parsed.id ||
            parsed.truecallerId ||
            '';
        } catch (e) {
          phoneNumber =
            req.body.phoneNumber || '';

          name =
            req.body.name ||
            'Truecaller User';
        }
      } else if (req.body.phoneNumber) {
        phoneNumber =
          req.body.phoneNumber;

        name =
          req.body.name ||
          'Truecaller User';

        email =
          req.body.email || '';
      }

      if (!phoneNumber && !truecallerId) {
        return res.status(400).json({
          message:
            'Invalid Truecaller payload. Phone number or ID missing.',
        });
      }

      let user = await User.findOne({
        $or: [
          ...(phoneNumber
            ? [{ phoneNumber }]
            : []),

          ...(truecallerId
            ? [{ truecallerId }]
            : []),
        ],
      });

      if (!user) {
        const userData = {
          name:
            name ||
            'Truecaller User',

          phoneNumber,
          truecallerId,

          authProvider: 'truecaller',

          cloudinaryConnected: false,
          cloudinaryCloudName: '',
          cloudinaryConnectedAt: null,
        };

        if (
          email &&
          email.trim() !== ''
        ) {
          const existingEmail =
            await User.findOne({
              email: email
                .toLowerCase()
                .trim(),
            });

          if (!existingEmail) {
            userData.email = email
              .toLowerCase()
              .trim();
          }
        }

        user = await User.create(userData);

        console.log(
          '✅ Created new user via Truecaller:',
          user._id,
        );
      } else {
        if (
          name &&
          (!user.name ||
            user.name ===
            'Truecaller User')
        ) {
          user.name = name;
        }

        if (
          truecallerId &&
          !user.truecallerId
        ) {
          user.truecallerId =
            truecallerId;
        }

        await user.save();

        console.log(
          '✅ Existing user authenticated via Truecaller:',
          user._id,
        );
      }

      const token =
        generateToken(user._id);

      res.json({
        token,
        user: formatUser(user),
      });
    } catch (err) {
      console.error(
        '❌ Error in /truecaller-login:',
        err,
      );

      res.status(500).json({
        message:
          err.message ||
          'Truecaller verification failed',
      });
    }
  },
);

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

      if (!cloudName) {
        return res.status(400).json({
          message:
            'Cloudinary Cloud Name is required',
        });
      }

      req.user.cloudinaryConnected = true;
      req.user.cloudinaryCloudName =
        cloudName;

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
      req.user.cloudinaryConnected = false;
      req.user.cloudinaryCloudName = '';
      req.user.cloudinaryConnectedAt = null;

      await req.user.save();

      res.json({
        message:
          'Cloudinary disconnected successfully',
        user: formatUser(req.user),
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