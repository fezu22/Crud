const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    encryptionSalt: { type: String, required: true, default: () => crypto.randomBytes(16).toString('base64') },
    truecallerId: {
      type: String,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'phone', 'truecaller'],
      default: 'email',
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    lastActiveAt: { type: Date, default: null },

    cloudinaryConnected: {
      type: Boolean,
      default: false,
    },

    cloudinaryCloudName: {
      type: String,
      trim: true,
      default: '',
    },
    cloudName: { type: String, trim: true, default: '' },
    uploadPreset: { type: String, trim: true, default: '' },

    cloudinaryConnectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

UserSchema.index({ cloudName: 1 }, {
  unique: true,
  partialFilterExpression: { cloudName: { $type: 'string', $ne: '' } },
});

module.exports = mongoose.model('User', UserSchema);
