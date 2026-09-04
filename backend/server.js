require('dotenv').config({
  path: require('path').join(__dirname, '.env'),
});

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const User = require('./models/User');

const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const projectRoutes = require('./routes/projectRoutes');
const chatRoutes = require('./routes/chatRoutes');

const {
  ensureConfiguredAdminAtStartup,
} = require('./utils/admin');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
  );

  next();
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;

  const dbStatus =
    dbState === 1
      ? 'Connected'
      : dbState === 2
        ? 'Connecting'
        : 'Disconnected';

  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

/*
  Socket.IO authentication
*/
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    const secret =
      process.env.JWT_SECRET ||
      'default_jwt_secret_key_change_in_production';

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid call authentication'));
  }
});

/*
  Real-time call signaling events
*/
io.on('connection', socket => {
  const userId = String(socket.user._id);

  socket.join(`user:${userId}`);

  console.log(`Call socket connected: ${socket.user.email || userId}`);

  const forwardToUser = (eventName, payload = {}) => {
    const targetUserId = String(payload.targetUserId || '');

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return;
    }

    io.to(`user:${targetUserId}`).emit(eventName, {
      ...payload,
      fromUserId: userId,
      fromName: socket.user.name || socket.user.email || 'Medi user',
    });
  };

  socket.on('call:invite', payload => {
    forwardToUser('call:incoming', payload);
  });

  socket.on('call:accept', payload => {
    forwardToUser('call:accepted', payload);
  });

  socket.on('call:reject', payload => {
    forwardToUser('call:rejected', payload);
  });

  socket.on('call:hangup', payload => {
    forwardToUser('call:hangup', payload);
  });

  socket.on('webrtc:offer', payload => {
    forwardToUser('webrtc:offer', payload);
  });

  socket.on('webrtc:answer', payload => {
    forwardToUser('webrtc:answer', payload);
  });

  socket.on('webrtc:ice-candidate', payload => {
    forwardToUser('webrtc:ice-candidate', payload);
  });

  socket.on('disconnect', () => {
    console.log(`Call socket disconnected: ${socket.user.email || userId}`);
  });
});

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/crudapp';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await ensureConfiguredAdminAtStartup();

    console.log('Connected to MongoDB');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(
        `Server running on port ${PORT} (http://localhost:${PORT})`,
      );
    });
  })
  .catch(error => {
    console.error(
      'MongoDB Connection Error:',
      error.message,
    );
  });