require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const projectRoutes = require('./routes/projectRoutes');

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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';

mongoose
  .connect(MONGO_URI)
  .then(function () {
    console.log('✅ Connected to MongoDB at:', MONGO_URI);
    app.listen(PORT, '0.0.0.0', function () {
      console.log('🚀 Server running on port ' + PORT + ' (http://localhost:' + PORT + ')');
    });
  })
  .catch(function (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  });
