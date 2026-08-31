const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    kind: {
      type: String,
      enum: ['upload', 'taskAttachment'],
      default: 'upload',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', MediaSchema);
