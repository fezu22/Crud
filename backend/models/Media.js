const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cloudinaryPublicId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    mediaUrl: { type: String, default: '' },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio'],
      default: 'image',
      index: true,
    },
    mimeType: { type: String, default: '' },
    originalName: { type: String, default: '' },
    resourceType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    bytes: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    title: { type: String, default: '', trim: true },
    kind: {
      type: String,
      enum: ['upload', 'taskAttachment', 'library'],
      default: 'upload',
      index: true,
    },
    batchId: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

MediaSchema.pre('validate', function normalizeMediaUrl() {
  if (!this.mediaUrl) this.mediaUrl = this.imageUrl;
  if (!this.imageUrl) this.imageUrl = this.mediaUrl;
});

module.exports = mongoose.model('Media', MediaSchema);
