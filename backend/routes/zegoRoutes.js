const express = require('express');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const appId = Number(process.env.ZEGO_APP_ID || '60432965');

// Official ZEGOCLOUD Token04 format, matching zego_server_assistant/nodejs.
function generateToken04(userId, secret, effectiveSeconds = 3600) {
  if (!appId || !userId || !secret || secret.length !== 32) return null;
  const createTime = Math.floor(Date.now() / 1000);
  const expireAt = createTime + effectiveSeconds;
  const iv = Buffer.from(Array.from({ length: 16 }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]).join(''));
  const payload = Buffer.from(JSON.stringify({ app_id: appId, user_id: userId, nonce: Math.ceil((-2147483648 + (2147483647 + 2147483648) * Math.random())), ctime: createTime, expire: expireAt, payload: '' }));
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const body = Buffer.alloc(8 + 2 + iv.length + 2 + encrypted.length);
  body.writeBigInt64BE(BigInt(expireAt), 0);
  body.writeUInt16BE(iv.length, 8); iv.copy(body, 10);
  body.writeUInt16BE(encrypted.length, 10 + iv.length); encrypted.copy(body, 12 + iv.length);
  return `04${body.toString('base64')}`;
}

router.get('/token', auth, (req, res) => {
  const userId = String(req.user?._id || '');
  const secret = process.env.ZEGO_SERVER_SECRET;
  if (!userId || !secret) return res.status(503).json({ message: 'ZEGOCLOUD calling is not configured.' });
  const token = generateToken04(userId, secret);
  if (!token) return res.status(503).json({ message: 'ZEGOCLOUD calling is not configured.' });
  res.set('Cache-Control', 'no-store').json({ appId, token, userId, expiresAt: Math.floor(Date.now() / 1000) + 3600 });
});

module.exports = router;
