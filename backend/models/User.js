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
    authProvider: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Set only after a successful authenticated sign-in (or account creation),
    // not on ordinary API activity. This is the retention-policy timestamp.
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    // Reserved for service/system identities. These are never auto-deactivated.
    isSystem: { type: Boolean, default: false },

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

UserSchema.index({ isActive: 1, lastLoginAt: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema);
