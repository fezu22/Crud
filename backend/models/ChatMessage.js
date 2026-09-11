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

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'voice', 'call'],
      default: 'text',
    },

    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document'],
      default: 'text',
    },

    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    editedAt: {
      type: Date,
      default: null,
    },

    attachmentUrl: {
      type: String,
      default: '',
    },

    attachmentFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

    attachmentName: {
      type: String,
      default: '',
    },

    attachmentMimeType: {
      type: String,
      default: '',
    },

    attachmentSize: {
      type: Number,
      default: 0,
    },

    mediaWidth: {
      type: Number,
      default: 0,
    },

    mediaHeight: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 0,
    },

    callType: { type: String, enum: ['voice', 'video'], default: null },
    callSessionId: { type: String, default: null },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    callStatus: { type: String, enum: ['answered', 'missed', 'declined', 'cancelled', 'failed', 'ended'], default: null },
    startedAt: { type: Date, default: null },
    answeredAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0, min: 0 },

    caption: {
      type: String,
      default: '',
      maxlength: 2000,
    },

    waveform: {
      type: [Number],
      default: [],
    },

    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    read: {
      type: Boolean,
      default: false,
    },

    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  },
);

ChatMessageSchema.index({
  sender: 1,
  receiver: 1,
  conversationId: 1,
  createdAt: 1,
});
ChatMessageSchema.index(
  { conversationId: 1, callSessionId: 1 },
  { unique: true, partialFilterExpression: { type: 'call', callSessionId: { $type: 'string' } } },
);

module.exports = mongoose.model(
  'ChatMessage',
  ChatMessageSchema,
);
