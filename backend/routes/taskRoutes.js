const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Media = require('../models/Media');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteCloudinaryTaskImages(userId, imageUrls) {
  const urls = [...new Set((imageUrls || []).filter(Boolean))];
  if (!urls.length) return;
  const mediaItems = await Media.find({ userId, imageUrl: { $in: urls } });
  const savedUrls = new Set(mediaItems.map(media => media.imageUrl));
  const legacyPublicIds = urls
    .filter(url => !savedUrls.has(url))
    .map(url => {
      const match = decodeURIComponent(url).match(
        /\/upload\/(?:[^/]+\/)*v\d+\/(medi_app_uploads\/[^?#]+?)\.[a-z0-9]+(?:\?|$)/i,
      );
      return match?.[1] || '';
    })
    .filter(Boolean);

  for (const media of mediaItems) {
    const result = await cloudinary.uploader.destroy(
      media.cloudinaryPublicId,
      { invalidate: true },
    );
    if (!['ok', 'not found'].includes(result?.result)) {
      throw new Error('Cloudinary image could not be deleted');
    }
    await media.deleteOne();
  }
  for (const publicId of legacyPublicIds) {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    if (!['ok', 'not found'].includes(result?.result)) {
      throw new Error('Legacy Cloudinary image could not be deleted');
    }
  }
}

// All task routes require authentication
router.use(auth);

// GET all tasks for logged-in user - sorted newest first
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ Error fetching tasks:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch tasks' });
  }
});

// GET a single task by ID (ensuring ownership)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('❌ Error fetching task by ID:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch task' });
  }
});

// POST - create a new task for logged-in user
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, imageUrls = [], dueDate, durationMinutes, priority, category, projectId, subtasks } = req.body;

    if ((!title || title.trim() === '') && !imageUrl && imageUrls.length === 0) {
      return res.status(400).json({ message: 'Task text or image is required' });
    }

    const task = await Task.create({
      user: req.user._id,
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      imageUrl: imageUrl || '',
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [],
      dueDate: dueDate || null,
      durationMinutes: durationMinutes ?? 30,
      priority: priority || 'Medium',
      category: category || 'Personal',
      projectId: projectId || null,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('❌ Error creating task:', err);
    res.status(500).json({ message: err.message || 'Failed to create task' });
  }
});

// PUT - update an existing task (ensuring ownership)
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'imageUrl', 'imageUrls', 'completed', 'dueDate', 'durationMinutes', 'priority', 'category', 'projectId', 'subtasks'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const existingTask = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (Array.isArray(updates.imageUrls)) {
      const oldUrls = existingTask.imageUrls?.length
        ? existingTask.imageUrls
        : [existingTask.imageUrl].filter(Boolean);
      const removedUrls = oldUrls.filter(
        url => !updates.imageUrls.includes(url),
      );
      await deleteCloudinaryTaskImages(req.user._id, removedUrls);
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('❌ Error updating task:', err);
    res.status(500).json({ message: err.message || 'Failed to update task' });
  }
});

// DELETE - remove a task (ensuring ownership)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const imageUrls = task.imageUrls?.length
      ? task.imageUrls
      : [task.imageUrl].filter(Boolean);
    await deleteCloudinaryTaskImages(req.user._id, imageUrls);
    await task.deleteOne();

    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('❌ Error deleting task:', err);
    res.status(500).json({ message: err.message || 'Failed to delete task' });
  }
});

module.exports = router;
