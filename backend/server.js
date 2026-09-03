require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const projectRoutes = require('./routes/projectRoutes');
const chatRoutes = require('./routes/chatRoutes');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting' : 'Disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';
// Override this with ADMIN_EMAIL in Render for a different admin account.
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'dadajackie3@gmail.com').trim().toLowerCase();

async function ensureConfiguredAdmin() {
  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) return console.warn(`Configured ADMIN_EMAIL was not found: ${ADMIN_EMAIL}`);
  if (admin.role !== 'admin') { admin.role = 'admin'; await admin.save(); console.log(`Admin role ensured for ${ADMIN_EMAIL}`); }
}

mongoose
  .connect(MONGO_URI)
  .then(async function () {
    await ensureConfiguredAdmin();
    console.log('✅ Connected to MongoDB at:', MONGO_URI);
    app.listen(PORT, '0.0.0.0', function () {
      console.log('🚀 Server running on port ' + PORT + ' (http://localhost:' + PORT + ')');
    });
  })
  .catch(function (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  });
