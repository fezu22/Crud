const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Media = require('../models/Media');
const auth = require('../middleware/auth');
const {
  buildTaskCreatePayload,
  pickTaskUpdates,
} = require('../utils/taskPayload');

async function protectTaskImages(tasks) {
  const list = Array.isArray(tasks) ? tasks : [tasks];
  const urls = [...new Set(list.flatMap(task => task.imageUrls || [task.imageUrl]).filter(Boolean))];
  // Tasks may contain a previously issued signed URL. Match those URLs by
  // Cloudinary public_id as well, because signed URLs expire and change.
  const publicIds = [...new Set(urls.map(url => {
    const match = String(url).match(/\/v\d+\/(.+?)(?:\.[^./?#]+)?(?:[?#].*)?$/i);
    return match ? decodeURIComponent(match[1]) : '';
  }).filter(Boolean))];
  const media = await Media.find({
    $or: [
      { imageUrl: { $in: urls } },
      { publicId: { $in: publicIds } },
      { cloudinaryPublicId: { $in: publicIds } },
    ],
  });
  const byUrl = new Map(media.map(item => [item.imageUrl, item]));
  const byPublicId = new Map(media.flatMap(item => [[item.publicId, item], [item.cloudinaryPublicId, item]]));
  return list.map(task => typeof task.toObject === 'function' ? task.toObject() : task);
}

async function deleteCloudinaryTaskImages(userId, imageUrls) {
  const urls = [...new Set((imageUrls || []).filter(Boolean))];
  if (!urls.length) return;
  const mediaItems = await Media.find({ userId, imageUrl: { $in: urls } });
  for (const media of mediaItems) {
    await media.deleteOne();
  }
}

// All task routes require authentication
router.use(auth);

// GET all tasks for logged-in user - sorted newest first
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(await protectTaskImages(tasks));
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
    res.json((await protectTaskImages(task))[0]);
  } catch (err) {
    console.error('❌ Error fetching task by ID:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch task' });
  }
});

// POST - create a new task for logged-in user
router.post('/', async (req, res) => {
  try {
    const imageUrls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls
      : [];
    if (
      (!req.body.title || req.body.title.trim() === '') &&
      !req.body.imageUrl &&
      imageUrls.length === 0
    ) {
      return res.status(400).json({ message: 'Task text or image is required' });
    }

    const task = await Task.create(
      buildTaskCreatePayload(req.body, req.user._id),
    );

    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || 'Failed to create task' });
  }
});

// PUT - update an existing task (ensuring ownership)
router.put('/:id', async (req, res) => {
  try {
    const updates = pickTaskUpdates(req.body);


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
      { returnDocument: 'after', runValidators: true },
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json((await protectTaskImages(task))[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || 'Failed to update task' });
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
