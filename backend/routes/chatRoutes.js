const express = require('express');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const {
  findAdminUser,
} = require('../utils/admin');

const router = express.Router();

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
});

const previewText = message => {
  if (message.text) {
    return message.text;
  }

  if (message.caption) {
    return message.caption;
  }

  if (message.type === 'image') {
    return '[Image]';
  }

  if (message.type === 'video') {
    return '[Video]';
  }

  if (message.type === 'document') {
    return message.fileName || '[Document]';
  }

  if (message.type === 'voice') {
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

    const messages =
      await ChatMessage.find({
        $or: [
          {
            sender:
              req.user._id,
            recipient:
              other._id,
          },
          {
            sender:
              other._id,
            recipient:
              req.user._id,
          },
        ],
      })
        .sort({
          createdAt: 1,
        })
        .limit(200);

    await ChatMessage.updateMany(
      {
        sender:
          other._id,
        recipient:
          req.user._id,
      },
      {
        $set: {
          read: true,
        },
      },
    );

    res.json({
      user:
        publicUser(other),
      messages,
    });
  },
);

router.post(
  '/:userId',
  async (req, res) => {
    const body = req.body || {};

    let type = [
      'text',
      'image',
      'video',
      'document',
      'voice',
    ].includes(body.type)
      ? body.type
      : 'text';

    const text = String(
      body.text || '',
    ).trim();

    const attachmentUrl = String(
      body.attachmentUrl || '',
    ).trim();

    if (type === 'text' && attachmentUrl) {
      type = inferAttachmentType(body);
    }

    const other =
      await User.findById(
        req.params.userId,
      ).select('_id');

    if (!other) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (type === 'text' && !text) {
      return res.status(400).json({
        message: 'Message cannot be empty',
      });
    }

    if (
      ['image', 'video', 'document'].includes(type) &&
      !attachmentUrl
    ) {
      return res.status(400).json({
        message: 'Attachment URL is required',
      });
    }

    const message =
      await ChatMessage.create({
        sender: req.user._id,
        recipient: other._id,
        type,
        text,
        attachmentUrl,
        fileName: String(
          body.fileName || '',
        ),
        fileType: String(
          body.fileType || '',
        ),
        fileSize: Number(
          body.fileSize || 0,
        ),
        duration: Number(
          body.duration || 0,
        ),
        caption: String(
          body.caption || '',
        ),
        waveform: Array.isArray(
          body.waveform,
        )
          ? body.waveform
              .slice(0, 120)
              .map(Number)
              .filter(Number.isFinite)
          : [],
      });

    return res.status(201).json(message);
  },
);

module.exports = router;
