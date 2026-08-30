const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch projects' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: 'Project name is required' });
    const project = await Project.create({
      user: req.user._id,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || '',
      color: req.body.color || '#EDE9FE',
      accent: req.body.accent || '#7C3AED',
      coverUrl: req.body.coverUrl || '',
      dueDate: req.body.dueDate || null,
      members: Array.isArray(req.body.members) ? req.body.members : [],
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create project' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'description', 'color', 'accent', 'coverUrl', 'dueDate', 'members'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update project' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.updateMany({ user: req.user._id, projectId: req.params.id }, { $set: { projectId: null } });
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete project' });
  }
});

module.exports = router;
