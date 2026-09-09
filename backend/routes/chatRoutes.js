const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const {
  findAdminUser,
} = require('../utils/admin');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const conversationIdFor = (firstUserId, secondUserId) =>
  [String(firstUserId), String(secondUserId)].sort().join('_');

router.use(auth);

const isOnline = lastActiveAt =>
  lastActiveAt &&
  Date.now() -
  new Date(lastActiveAt).getTime() <=
  30000;

const publicUser = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  online: isOnline(u.lastActiveAt),
  lastSeenAt: u.lastActiveAt || null,
});

const previewText = message => {
  const text = String(message.text || '').trim();
  const caption = String(message.caption || '').trim();

  if (text) {
    return text;
  }

  if (caption) {
    return caption;
  }

  if (message.type === 'image' || message.messageType === 'image') {
    return '[Image]';
  }

  if (message.type === 'video' || message.messageType === 'video') {
    return '[Video]';
  }

  if (message.type === 'document' || message.messageType === 'document') {
    return message.fileName || '[Document]';
  }

  if (
    message.type === 'voice' ||
    message.type === 'audio' ||
    message.messageType === 'audio'
  ) {
    return '[Voice message]';
  }

  return '';
};

const inferAttachmentType = body => {
  const fileType = String(body.fileType || '').toLowerCase();
  const fileName = String(body.fileName || '').toLowerCase();
  const attachmentUrl = String(body.attachmentUrl || '').toLowerCase();

  if (
    fileType.startsWith('video/') ||
    attachmentUrl.includes('/video/upload/') ||
    /\.(mp4|mov|m4v|webm|mkv|avi)(\?|$)/i.test(fileName) ||
    /\.(mp4|mov|m4v|webm|mkv|avi)(\?|$)/i.test(attachmentUrl)
  ) {
    return 'video';
  }

  if (
    fileType.startsWith('image/') ||
    attachmentUrl.includes('/image/upload/') ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/i.test(fileName) ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/i.test(attachmentUrl)
  ) {
    return 'image';
  }

  return 'document';
};

function getChatFilesBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'chatAttachments',
  });
}

function buildAttachmentUrl(req, fileId) {
  return `${req.protocol}://${req.get('host')}/api/chat/attachments/${fileId}`;
}

function parseWaveform(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

router.get('/users', async (req, res) => {
  const q = String(
    req.query.q || '',
  ).trim();

  const filter = {
    _id: { $ne: req.user._id },
    role: { $ne: 'admin' },
  };

  if (q) {
    filter.$or = [
      {
        name: new RegExp(q, 'i'),
      },
      {
        email: new RegExp(q, 'i'),
      },
    ];
  }

  const users = await User.find(
    filter,
  )
    .select(
      'name email role lastActiveAt',
    )
    .sort({ name: 1 })
    .limit(30);

  res.json(users.map(publicUser));
});

router.get(
  '/admin',
  async (req, res, next) => {
    try {
      const admin =
        await findAdminUser();

      if (!admin) {
        console.warn(
          '[chat] Admin lookup failed: no configured or existing admin account was found.',
        );

        return res
          .status(404)
          .json({
            message:
              'Admin chat is not configured yet. Set ADMIN_EMAIL on the server and sign in with that account.',
          });
      }

      res.json(publicUser(admin));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/conversations',
  async (req, res) => {
    const messages =
      await ChatMessage.find({
        $or: [
          {
            sender: req.user._id,
          },
          {
            recipient: req.user._id,
          },
        ],
        deletedFor: { $ne: req.user._id },
      })
        .sort({ createdAt: -1 })
        .lean();

    const groups = new Map();

    messages.forEach(m => {
      const id =
        String(m.sender) ===
          String(req.user._id)
          ? m.recipient
          : m.sender;

      if (!groups.has(String(id))) {
        groups.set(String(id), []);
      }

      groups
        .get(String(id))
        .push(m);
    });

    const users = await User.find({
      _id: {
        $in: [...groups.keys()],
      },
    })
      .select(
        'name email role lastActiveAt',
      )
      .lean();

    res.json(
      users
        .map(u => {
          const ms = groups.get(
            String(u._id),
          );

          return {
            user: publicUser(u),

            lastMessage:
              previewText(ms[0]),

            lastMessageAt:
              ms[0].createdAt,

            lastMessageType:
              ms[0].type || ms[0].messageType || 'text',

            unreadCount:
              ms.filter(
                m =>
                  String(
                    m.recipient,
                  ) ===
                  String(
                    req.user._id,
                  ) &&
                  !m.read,
              ).length,
          };
        })
        .sort(
          (a, b) =>
            new Date(
              b.lastMessageAt,
            ) -
            new Date(
              a.lastMessageAt,
            ),
        ),
    );
  },
);

router.get(
  '/all-users',
  async (req, res) => {
    if (
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({
          message:
            'Admin access required',
        });
    }

    const q = String(
      req.query.q || '',
    ).trim();

    const filter = {
      role: {
        $ne: 'admin',
      },
    };

    if (q) {
      filter.$or = [
        {
          name: new RegExp(
            q,
            'i',
          ),
        },
        {
          email: new RegExp(
            q,
            'i',
          ),
        },
      ];
    }

    const users =
      await User.find(filter)
        .select(
          'name email role lastActiveAt',
        )
        .sort({
          name: 1,
        });

    res.json(
      users.map(publicUser),
    );
  },
);

router.get(
  '/attachments/:fileId',
  async (req, res, next) => {
    try {
      const { fileId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(404).json({
          message: 'Attachment not found',
        });
      }

      const _id = new mongoose.Types.ObjectId(fileId);
      const bucket = getChatFilesBucket();
      const file = await bucket.find({ _id }).next();

      if (!file) {
        return res.status(404).json({
          message: 'Attachment not found',
        });
      }

      const sender = file.metadata?.sender;
      const receiver = file.metadata?.receiver;
      const requester = String(req.user._id);

      if (requester !== String(sender) && requester !== String(receiver)) {
        return res.status(403).json({
          message: 'You cannot view this attachment',
        });
      }

      if (file.contentType) {
        res.set('Content-Type', file.contentType);
      }

      res.set('Content-Length', String(file.length));
      bucket.openDownloadStream(_id).on('error', next).pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/:userId/attachments',
  upload.single('file'),
  async (req, res, next) => {
    try {
      const other = await User.findById(
        req.params.userId,
      ).select('_id');

      if (!other || String(other._id) === String(req.user._id)) {
        return res.status(404).json({
          message: 'Chat recipient not found',
        });
      }

      if (!req.file?.buffer?.length) {
        return res.status(400).json({
          message: 'Attachment file is required',
        });
      }

      const conversationId = conversationIdFor(
        req.user._id,
        other._id,
      );
      const fileType = req.file.mimetype || '';
      const fileName = req.file.originalname || 'attachment';
      const fileSize = req.file.size || req.file.buffer.length;
      let messageType = req.body.type || req.body.messageType || '';

      if (!['image', 'video', 'audio', 'document'].includes(messageType)) {
        messageType = inferAttachmentType({
          attachmentUrl: '',
          fileType,
          fileName,
        });
      }

      if (messageType === 'voice') {
        messageType = 'audio';
      }

      const bucket = getChatFilesBucket();
      const uploadStream = bucket.openUploadStream(fileName, {
        contentType: fileType || 'application/octet-stream',
        metadata: {
          sender: req.user._id,
          receiver: other._id,
          conversationId,
          messageType,
        },
      });

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
        uploadStream.end(req.file.buffer);
      });

      const fileId = uploadStream.id;
      const publicAttachmentUrl = buildAttachmentUrl(req, fileId);
      const message = await ChatMessage.create({
        sender: req.user._id,
        recipient: other._id,
        receiver: other._id,
        conversationId,
        type: messageType === 'audio' ? 'voice' : messageType,
        messageType,
        text: String(req.body.text || '').trim(),
        attachmentUrl: publicAttachmentUrl,
        attachmentFileId: fileId,
        fileName,
        fileType,
        fileSize,
        attachmentName: fileName,
        attachmentMimeType: fileType,
        attachmentSize: fileSize,
        mediaWidth: Number(req.body.mediaWidth || 0),
        mediaHeight: Number(req.body.mediaHeight || 0),
        duration: Number(req.body.duration || 0),
        caption: String(req.body.caption || ''),
        waveform: parseWaveform(req.body.waveform)
          .slice(0, 120)
          .map(Number)
          .filter(Number.isFinite),
        deliveryStatus: 'sent',
      });

      const io = req.app.get('io');
      const chatEvent = {
        ...message.toObject(),
        fromName: req.user.name || req.user.email || 'Medi user',
      };
      io?.to(`conversation:${conversationId}`).emit('chat:message', chatEvent);
      io?.to(`user:${String(other._id)}`).emit('chat:message', chatEvent);

      return res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:userId',
  async (req, res) => {
    const other =
      await User.findById(
        req.params.userId,
      ).select(
        'name email role lastActiveAt',
      );

    if (!other) {
      return res
        .status(404)
        .json({
          message:
            'User not found',
        });
    }

    const conversationId = conversationIdFor(
      req.user._id,
      other._id,
    );

      const messages =
      await ChatMessage.find({
        conversationId,
        $or: [
          { sender: req.user._id, receiver: other._id },
          { sender: other._id, receiver: req.user._id },
          { sender: req.user._id, recipient: other._id },
          { sender: other._id, recipient: req.user._id },
        ],
        deletedFor: { $ne: req.user._id },
      })
        .sort({
          createdAt: 1,
        })
        .limit(200);

    await ChatMessage.updateMany(
      {
        sender:
          other._id,
        $or: [
          { receiver: req.user._id },
          { recipient: req.user._id },
        ],
        conversationId,
      },
      {
        $set: {
          read: true,
          deliveryStatus: 'read',
        },
      },
    );

    res.json({
      user:
        publicUser(other),
      conversationId,
      messages,
    });
  },
);

// Hides the complete conversation for the current user. Messages remain
// available to the other participant, just like "Delete for me" in chat apps.
router.delete('/:userId/conversation', async (req, res, next) => {
  try {
    const other = await User.findById(req.params.userId).select('_id');
    if (!other || String(other._id) === String(req.user._id)) {
      return res.status(404).json({ message: 'Chat recipient not found' });
    }
    const conversationId = conversationIdFor(req.user._id, other._id);
    const result = await ChatMessage.updateMany(
      { conversationId, $or: [{ sender: req.user._id }, { recipient: req.user._id }, { receiver: req.user._id }] },
      { $addToSet: { deletedFor: req.user._id } },
    );
    req.app.get('io')?.to(`user:${String(req.user._id)}`).emit('chat:conversation-hidden', {
      conversationId,
      userId: String(other._id),
    });
    return res.json({ message: 'Conversation deleted for you', modifiedCount: result.modifiedCount || 0 });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  '/:userId/messages',
  async (req, res, next) => {
    try {
      const messageIds = Array.isArray(req.body?.messageIds)
        ? [...new Set(req.body.messageIds.map(String))]
        : [];

      if (!messageIds.length || messageIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ message: 'Valid message IDs are required' });
      }

      const other = await User.findById(req.params.userId).select('_id');
      if (!other || String(other._id) === String(req.user._id)) {
        return res.status(404).json({ message: 'Chat recipient not found' });
      }

      const conversationId = conversationIdFor(req.user._id, other._id);
      const mode = req.body?.mode === 'me' ? 'me' : 'everyone';

      if (mode === 'me') {
        const messages = await ChatMessage.find({
          _id: { $in: messageIds },
          conversationId,
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id },
          ],
        }).select('_id');
        const hiddenIds = messages.map(message => String(message._id));
        await ChatMessage.updateMany(
          { _id: { $in: hiddenIds } },
          { $addToSet: { deletedFor: req.user._id } },
        );
        req.app.get('io')?.to(`user:${String(req.user._id)}`).emit('chat:messages-hidden', {
          conversationId,
          messageIds: hiddenIds,
        });
        return res.json({ message: 'Messages deleted for you', deletedIds: hiddenIds });
      }

      const messages = await ChatMessage.find({
        _id: { $in: messageIds },
        conversationId,
        $or: [
          // Only the sender can remove a message for everyone. Recipients
          // can still use mode=me, which only hides it from their account.
          { sender: req.user._id },
        ],
      }).select('_id attachmentFileId');

      const bucket = getChatFilesBucket();
      await Promise.all(messages.map(async message => {
        if (!message.attachmentFileId) return;
        try {
          await bucket.delete(message.attachmentFileId);
        } catch (error) {
          if (error.codeName !== 'NamespaceNotFound') throw error;
        }
      }));

      const deletedIds = messages.map(message => String(message._id));
      await ChatMessage.deleteMany({ _id: { $in: deletedIds } });
      const io = req.app.get('io');
      const deletionEvent = {
        conversationId,
        messageIds: deletedIds,
      };
      io?.to(`conversation:${conversationId}`).emit('chat:message-deleted', deletionEvent);
      io?.to(`user:${String(req.user._id)}`).emit('chat:message-deleted', deletionEvent);
      io?.to(`user:${String(other._id)}`).emit('chat:message-deleted', deletionEvent);

      return res.json({ message: 'Messages deleted', deletedIds });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:userId/messages/:messageId',
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
        return res.status(404).json({ message: 'Message not found' });
      }

      const other = await User.findById(req.params.userId).select('_id');
      if (!other || String(other._id) === String(req.user._id)) {
        return res.status(404).json({ message: 'Chat recipient not found' });
      }

      const conversationId = conversationIdFor(req.user._id, other._id);
      const message = await ChatMessage.findOne({
        _id: req.params.messageId,
        conversationId,
        $or: [
          { sender: req.user._id },
          { sender: other._id },
        ],
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found or cannot be deleted' });
      }

      if (message.attachmentFileId) {
        try {
          await getChatFilesBucket().delete(message.attachmentFileId);
        } catch (error) {
          if (error.codeName !== 'NamespaceNotFound') throw error;
        }
      }

      await message.deleteOne();
      const deletionEvent = {
        conversationId,
        messageIds: [String(message._id)],
      };
      req.app.get('io')?.to(`conversation:${conversationId}`).emit('chat:message-deleted', deletionEvent);
      req.app.get('io')?.to(`user:${String(req.user._id)}`).emit('chat:message-deleted', deletionEvent);
      req.app.get('io')?.to(`user:${String(other._id)}`).emit('chat:message-deleted', deletionEvent);

      return res.json({ message: 'Message deleted', messageId: String(message._id) });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:userId/messages/:messageId',
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
        return res.status(404).json({ message: 'Message not found' });
      }

      const other = await User.findById(req.params.userId).select('_id');
      if (!other || String(other._id) === String(req.user._id)) {
        return res.status(404).json({ message: 'Chat recipient not found' });
      }

      const conversationId = conversationIdFor(req.user._id, other._id);
      const message = await ChatMessage.findOne({
        _id: req.params.messageId,
        conversationId,
        $or: [
          { sender: req.user._id },
          { sender: other._id },
        ],
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (message.type !== 'text' && message.messageType !== 'text') {
        return res.status(400).json({ message: 'Only text messages can be edited' });
      }

      const text = String(req.body?.text || '').trim();
      if (!text) {
        return res.status(400).json({ message: 'Message cannot be empty' });
      }

      message.text = text;
      message.editedAt = new Date();
      await message.save();

      req.app.get('io')?.to(`conversation:${conversationId}`).emit('chat:message-updated', message);
      return res.json(message);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/:userId',
  async (req, res) => {
    const body = req.body || {};
    const other =
      await User.findById(
        req.params.userId,
      ).select('_id');

    if (!other || String(other._id) === String(req.user._id)) {
      return res.status(404).json({
        message: 'Chat recipient not found',
      });
    }

    const conversationId = conversationIdFor(
      req.user._id,
      other._id,
    );
    let messageType = body.messageType || body.type || 'text';
    if (messageType === 'voice') messageType = 'audio';
    if (!['text', 'image', 'video', 'audio'].includes(messageType)) {
      messageType = inferAttachmentType(body);
    }

    const text = String(body.text || '').trim();
    const attachmentUrl = String(body.attachmentUrl || '').trim();
    const attachmentName = String(body.attachmentName || body.fileName || '').trim();
    const attachmentMimeType = String(body.attachmentMimeType || body.fileType || '').trim();
    const attachmentSize = Number(body.attachmentSize ?? body.fileSize ?? 0);
    const duration = Number(body.duration || 0);

    if (messageType === 'text' && !text) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (messageType !== 'text' && !attachmentUrl) {
      return res.status(400).json({ message: 'Attachment URL is required' });
    }

    if (messageType !== 'text' && !/^https:\/\//i.test(attachmentUrl)) {
      return res.status(400).json({ message: 'Attachment URL must be a secure cloud URL' });
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      recipient: other._id,
      receiver: other._id,
      conversationId,
      type: messageType === 'audio' ? 'voice' : messageType,
      messageType,
      text,
      attachmentUrl,
      fileName: attachmentName,
      fileType: attachmentMimeType,
      fileSize: attachmentSize,
      attachmentName,
      attachmentMimeType,
      attachmentSize,
      duration,
      caption: String(body.caption || ''),
      waveform: Array.isArray(body.waveform)
        ? body.waveform.slice(0, 120).map(Number).filter(Number.isFinite)
        : [],
      deliveryStatus: 'sent',
    });

    const io = req.app.get('io');
    const chatEvent = {
      ...message.toObject(),
      fromName: req.user.name || req.user.email || 'Medi user',
    };
    io?.to(`conversation:${conversationId}`).emit('chat:message', chatEvent);
    io?.to(`user:${String(other._id)}`).emit('chat:message', chatEvent);

    return res.status(201).json(message);
  },
);

module.exports = router;
