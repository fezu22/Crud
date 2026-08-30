const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#EDE9FE' },
    accent: { type: String, default: '#7C3AED' },
    coverUrl: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    members: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
