const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
}, { timestamps: true });

ChatMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
