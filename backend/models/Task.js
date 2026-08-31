const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: { type: Date, default: null },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 1,
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    category: { type: String, enum: ['Personal', 'Work', 'Health', 'Shopping'], default: 'Personal' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    subtasks: {
      type: [{ label: { type: String, required: true, trim: true }, done: { type: Boolean, default: false } }],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);