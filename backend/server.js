require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';

mongoose.connect(MONGO_URI).then(function () {
  console.log('Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', function () {
    console.log('Server running on port ' + PORT);
  });
}).catch(function (err) {
  console.error('MongoDB Error:', err.message);
});
