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
const agoraRoutes = require('./routes/agoraRoutes');

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

app.set('io', io);

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
app.use('/api/agora', agoraRoutes);

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
const activeSockets = new Map();

io.on('connection', socket => {
  const userId = String(socket.user._id);

  activeSockets.set(userId, (activeSockets.get(userId) || 0) + 1);
  User.updateOne({ _id: socket.user._id }, { lastActiveAt: new Date() }).catch(() => {});
  io.emit('presence:update', { userId, online: true, lastSeenAt: new Date().toISOString() });

  socket.join(`user:${userId}`);

  console.log(`Call socket connected: ${socket.user.email || userId}`);

  socket.on('chat:join', payload => {
    const conversationId = String(payload?.conversationId || '');
    const participants = conversationId.split('_');
    if (participants.length === 2 && participants.includes(userId)) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on('chat:leave', payload => {
    const conversationId = String(payload?.conversationId || '');
    socket.leave(`conversation:${conversationId}`);
  });

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
    if (!activeSockets.has(String(payload?.targetUserId || ''))) {
      socket.emit('call:unavailable', { callId: payload?.callId });
      return;
    }
    forwardToUser('call:incoming', payload);
  });

  socket.on('call:accept', payload => {
    forwardToUser('call:accepted', payload);
  });

  socket.on('call:reject', payload => {
    forwardToUser('call:rejected', payload);
  });

  socket.on('call:hangup', (payload, acknowledge) => {
    forwardToUser('call:hangup', payload);
    if (typeof acknowledge === 'function') acknowledge({ ok: true });
  });

  socket.on('disconnect', () => {
    const remaining = (activeSockets.get(userId) || 1) - 1;
    if (remaining > 0) {
      activeSockets.set(userId, remaining);
    } else {
      activeSockets.delete(userId);
      User.updateOne({ _id: socket.user._id }, { lastActiveAt: null }).catch(() => {});
      io.emit('presence:update', { userId, online: false, lastSeenAt: new Date().toISOString() });
    }
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
