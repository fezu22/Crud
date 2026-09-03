const express = require('express');
const mongoose = require('mongoose');
const Media = require('../models/Media');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

function signedViewUrl(media) {
  return { url: media.mediaUrl || media.imageUrl, expiresAt: null };
}

router.get('/:id/view-url', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Media not found' });
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ message: 'Media not found' });
  if (String(media.userId) !== String(req.user._id)) return res.status(403).json({ message: 'You do not own this media' });
  res.json(signedViewUrl(media));
});

router.post('/signature', (req, res) => res.status(410).json({ message: 'Server Cloudinary configuration has been removed. Use your personal Cloudinary Cloud Name and unsigned Upload Preset.' }));

router.post('/register', async (req, res) => {
  try {
    const b = req.body || {};
    const deliveryUrl = b.secure_url || b.url;
    if (!b.public_id || !deliveryUrl) return res.status(400).json({ message: 'Invalid Cloudinary metadata: public_id or URL missing' });
    const resourceType = b.resource_type || (b.isPrivate ? 'raw' : 'image');
    const mediaType = resourceType === 'video' ? 'video' : resourceType === 'audio' ? 'audio' : 'image';
    const media = await Media.create({ userId: req.user._id, ownerId: req.user._id, isPrivate: Boolean(b.isPrivate), encryption: b.encryption || undefined, cloudName: String(b.cloudName || '').trim(), assetId: b.asset_id || '', publicId: b.public_id, cloudinaryPublicId: b.public_id, imageUrl: deliveryUrl, mediaUrl: deliveryUrl, resourceType, mediaType, mimeType: b.encryption?.encryptedMimeType || b.mime_type || '', originalName: b.original_filename || '', format: b.format || '', bytes: Number(b.bytes) || 0, width: Number(b.width) || 0, height: Number(b.height) || 0, duration: Number(b.duration) || 0, title: String(b.title || '').trim(), kind: b.kind === 'taskAttachment' ? 'taskAttachment' : b.kind === 'library' ? 'library' : 'upload', batchId: b.batchId || null });
    res.status(201).json({ ...media.toObject(), imageUrl: signedViewUrl(media).url, mediaUrl: signedViewUrl(media).url });
  } catch (error) { console.error('Media registration failed:', error); res.status(500).json({ message: error.message || 'Could not register media' }); }
});
router.get('/my-uploads', async (req, res) => { const cloudName = String(req.query.cloudName || '').trim(); if (!cloudName) return res.json([]); const items = await Media.find({ userId: req.user._id, cloudName }).sort({ createdAt: -1 }).lean(); res.json(items.map(media => ({ ...media, imageUrl: signedViewUrl(media).url, mediaUrl: signedViewUrl(media).url }))); });
router.get('/private', async (req, res) => res.json(await Media.find({ ownerId: req.user._id, isPrivate: true }).select('-imageUrl -mediaUrl').sort({ createdAt: -1 })));
router.get('/by-url', async (req, res) => { const media = await Media.findOne({ userId: req.user._id, imageUrl: req.query.imageUrl }); if (!media) return res.status(404).json({ message: 'Media not found' }); res.json(media); });
async function removeRefs(userId, url) { const tasks = await Task.find({ user: userId, $or: [{ imageUrl: url }, { imageUrls: url }] }); await Promise.all(tasks.map(task => { task.imageUrls = (task.imageUrls || []).filter(item => item !== url); if (task.imageUrl === url) task.imageUrl = task.imageUrls[0] || ''; return task.save(); })); }
router.delete('/by-url', async (req, res) => { const url = req.body?.imageUrl; if (!url) return res.status(400).json({ message: 'Image URL is required' }); const media = await Media.findOne({ userId: req.user._id, imageUrl: url }); if (!media) return res.status(404).json({ message: 'Media not found' }); await removeRefs(req.user._id, url); await media.deleteOne(); res.json({ message: 'Media removed from this app', imageUrl: url }); });
router.delete('/:id', async (req, res) => { if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Media not found' }); const media = await Media.findOne({ _id: req.params.id, userId: req.user._id }); if (!media) return res.status(404).json({ message: 'Media not found' }); await removeRefs(req.user._id, media.imageUrl); await media.deleteOne(); res.json({ message: 'Media removed from this app', id: req.params.id }); });
module.exports = router;
