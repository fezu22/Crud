const express = require('express');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

const isOnline = lastActiveAt => lastActiveAt && Date.now() - new Date(lastActiveAt).getTime() <= 30000;
const publicUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, online: isOnline(u.lastActiveAt) });

router.get('/users', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = { _id: { $ne: req.user._id }, role: { $ne: 'admin' } };
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(filter).select('name email role lastActiveAt').sort({ name: 1 }).limit(30);
  res.json(users.map(publicUser));
});

router.get('/admin', async (req, res) => {
  const configuredEmail = String(process.env.ADMIN_EMAIL || 'dadajackie3@gmail.com').trim().toLowerCase();
  const admin = await User.findOne({ $or: [{ email: configuredEmail, role: 'admin' }, { role: 'admin' }] }).select('name email role lastActiveAt');
  if (!admin) return res.status(404).json({ message: 'Admin chat is not configured yet.' });
  res.json(publicUser(admin));
});

router.get('/conversations', async (req, res) => {
  const messages = await ChatMessage.find({ $or: [{ sender: req.user._id }, { recipient: req.user._id }] }).sort({ createdAt: -1 }).lean();
  const groups = new Map(); messages.forEach(m => { const id = String(m.sender) === String(req.user._id) ? m.recipient : m.sender; if (!groups.has(String(id))) groups.set(String(id), []); groups.get(String(id)).push(m); });
  const users = await User.find({ _id: { $in: [...groups.keys()] } }).select('name email role lastActiveAt').lean();
  res.json(users.map(u => { const ms = groups.get(String(u._id)); return { user: publicUser(u), lastMessage: ms[0].text, lastMessageAt: ms[0].createdAt, unreadCount: ms.filter(m => String(m.recipient) === String(req.user._id) && !m.read).length }; }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
});

router.get('/all-users', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const q = String(req.query.q || '').trim();
  const filter = { role: { $ne: 'admin' } };
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(filter).select('name email role lastActiveAt').sort({ name: 1 });
  res.json(users.map(publicUser));
});

router.get('/:userId', async (req, res) => {
  const other = await User.findById(req.params.userId).select('name email role lastActiveAt');
  if (!other) return res.status(404).json({ message: 'User not found' });
  const messages = await ChatMessage.find({ $or: [{ sender: req.user._id, recipient: other._id }, { sender: other._id, recipient: req.user._id }] }).sort({ createdAt: 1 }).limit(200);
  await ChatMessage.updateMany({ sender: other._id, recipient: req.user._id }, { $set: { read: true } });
  res.json({ user: publicUser(other), messages });
});

router.post('/:userId', async (req, res) => {
  const text = String(req.body.text || '').trim();
  const other = await User.findById(req.params.userId).select('_id');
  if (!other) return res.status(404).json({ message: 'User not found' });
  if (!text) return res.status(400).json({ message: 'Message cannot be empty' });
  const message = await ChatMessage.create({ sender: req.user._id, recipient: other._id, text });
  res.status(201).json(message);
});
module.exports = router;
