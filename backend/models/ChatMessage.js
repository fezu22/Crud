const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['text', 'image', 'document', 'voice'],
      default: 'text',
    },

    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    attachmentUrl: {
      type: String,
      default: '',
    },

    fileName: {
      type: String,
      default: '',
    },

    fileType: {
      type: String,
      default: '',
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 0,
    },

    caption: {
      type: String,
      default: '',
      maxlength: 2000,
    },

    waveform: {
      type: [Number],
      default: [],
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

ChatMessageSchema.index({
  sender: 1,
  recipient: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  'ChatMessage',
  ChatMessageSchema,
);