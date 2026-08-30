const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Media = require('../models/Media');
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
      await cloudinary.uploader.destroy(media.cloudinaryPublicId);
      console.log(`🗑️ Removed from Cloudinary: ${media.cloudinaryPublicId}`);
    } catch (cErr) {
      console.warn('⚠️ Cloudinary destroy warning:', cErr.message);
    }

    // 2. Remove document from MongoDB
    await Media.findByIdAndDelete(req.params.id);
    console.log(`✅ Removed Media doc from MongoDB: ${req.params.id}`);

    res.json({ message: 'Media deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('❌ Error in /media/:id delete:', err);
    res.status(500).json({ message: err.message || 'Failed to delete media' });
  }
});

module.exports = router;
