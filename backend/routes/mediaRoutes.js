const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Media = require('../models/Media');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Diagnostic: verify env vars are loaded
console.log('🔍 [mediaRoutes] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ MISSING');
console.log('🔍 [mediaRoutes] CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ MISSING');
console.log('🔍 [mediaRoutes] CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ MISSING');

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medi_app_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ quality: 'auto' }],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB file limit
});

// All media routes require JWT authentication
router.use(auth);

async function destroyCloudinaryAsset(publicId) {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });
  if (!['ok', 'not found'].includes(result?.result)) {
    throw new Error('Cloudinary could not delete the asset');
  }
}

function getPublicIdFromCloudinaryUrl(imageUrl) {
  if (!imageUrl) return '';
  const match = decodeURIComponent(imageUrl).match(
    /\/upload\/(?:[^/]+\/)*v\d+\/(medi_app_uploads\/[^?#]+?)\.[a-z0-9]+(?:\?|$)/i,
  );
  return match?.[1] || '';
}

async function replaceTaskImageReferences(userId, oldUrl, newUrl = '') {
  if (!oldUrl) return;
  const tasks = await Task.find({
    user: userId,
    $or: [{ imageUrl: oldUrl }, { imageUrls: oldUrl }],
  });
  await Promise.all(
    tasks.map(task => {
      task.imageUrls = [
        ...new Set(
          (task.imageUrls || [])
            .map(url => (url === oldUrl ? newUrl : url))
            .filter(Boolean),
        ),
      ];
      if (task.imageUrl === oldUrl) task.imageUrl = task.imageUrls[0] || '';
      return task.save();
    }),
  );
}

// ================= 1. UPLOAD MEDIA =================
// POST /api/media/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload' });
    }

    const secureUrl = req.file.path || req.file.secure_url;
    const publicId = req.file.filename || req.file.public_id;

    if (!secureUrl || !publicId) {
      return res.status(500).json({ message: 'Failed to retrieve Cloudinary upload details' });
    }

    // Strictly save ONLY the reference strings in MongoDB (NO raw image binaries)
    const media = await Media.create({
      userId: req.user._id,
      cloudinaryPublicId: publicId,
      imageUrl: secureUrl,
      title: req.body.title ? req.body.title.trim() : '',
      kind:
        req.body.kind === 'taskAttachment'
          ? 'taskAttachment'
          : 'upload',
      batchId: req.body.batchId || null,
    });

    console.log(`✅ Media created in MongoDB for user: ${req.user._id} (${media._id})`);
    res.status(201).json(media);
  } catch (err) {
    console.error('❌ Error in /media/upload:', err);
    res.status(500).json({ message: err.message || 'Server error during media upload' });
  }
});

// ================= 2. GET USER'S UPLOADS =================
// GET /api/media/my-uploads
router.get('/my-uploads', async (req, res) => {
  try {
    // Strict user-specific isolation: only return records matching the logged-in user's ID
    const uploads = await Media.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(uploads);
  } catch (err) {
    console.error('❌ Error in /media/my-uploads:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch user uploads' });
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const media = await Media.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!media) return res.status(404).json({ message: 'Media not found' });
    req.ownedMedia = media;
    next();
  } catch (err) {
    next(err);
  }
}, upload.single('image'), async (req, res) => {
  const media = req.ownedMedia;
  const oldUrl = media.imageUrl;
  const newPublicId = req.file?.filename || req.file?.public_id;
  const newUrl = req.file?.path || req.file?.secure_url;
  try {
    if (req.body.title !== undefined) media.title = req.body.title.trim();
    if (req.file) {
      if (!newPublicId || !newUrl) {
        return res.status(500).json({
          message: 'Failed to retrieve Cloudinary upload details',
        });
      }
      try {
        await destroyCloudinaryAsset(media.cloudinaryPublicId);
      } catch (error) {
        await destroyCloudinaryAsset(newPublicId).catch(() => { });
        return res.status(502).json({
          message: 'Old Cloudinary image could not be removed. Nothing was changed.',
        });
      }
      media.cloudinaryPublicId = newPublicId;
      media.imageUrl = newUrl;
    }
    await media.save();
    if (req.file) await replaceTaskImageReferences(req.user._id, oldUrl, newUrl);
    res.json(media);
  } catch (err) {
    if (req.file) await destroyCloudinaryAsset(newPublicId).catch(() => { });
    res
      .status(500)
      .json({ message: err.message || 'Failed to update media' });
  }
});

router.delete('/by-url', async (req, res) => {
  try {
    const imageUrl = req.body?.imageUrl;
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const media = await Media.findOne({
      userId: req.user._id,
      imageUrl,
    });
    const publicId =
      media?.cloudinaryPublicId || getPublicIdFromCloudinaryUrl(imageUrl);
    if (!publicId) {
      return res.status(404).json({ message: 'Cloudinary image not found' });
    }

    await destroyCloudinaryAsset(publicId);
    await replaceTaskImageReferences(req.user._id, imageUrl);
    if (media) await media.deleteOne();

    res.json({ message: 'Image deleted from Cloudinary', imageUrl });
  } catch (err) {
    console.error('Cloudinary URL delete failed:', err);
    res.status(502).json({
      message: err.message || 'Cloudinary image could not be deleted',
    });
  }
});

// ================= 3. DELETE MEDIA =================
// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Strict ownership verification
    if (media.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this media asset' });
    }

    // 1. Destroy asset in Cloudinary
    try {
      await destroyCloudinaryAsset(media.cloudinaryPublicId);
      console.log(`🗑️ Removed from Cloudinary: ${media.cloudinaryPublicId}`);
    } catch (cErr) {
      return res.status(502).json({
        message: 'Cloudinary image could not be deleted. Please try again.',
      });
    }

    // 2. Remove document from MongoDB
    await replaceTaskImageReferences(req.user._id, media.imageUrl);
    await Media.findByIdAndDelete(req.params.id);
    console.log(`✅ Removed Media doc from MongoDB: ${req.params.id}`);

    res.json({ message: 'Media deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('❌ Error in /media/:id delete:', err);
    res.status(500).json({ message: err.message || 'Failed to delete media' });
  }
});

module.exports = router;
