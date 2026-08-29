const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

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
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
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
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
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
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('❌ Error deleting task:', err);
    res.status(500).json({ message: err.message || 'Failed to delete task' });
  }
});

module.exports = router;


