/* eslint-env node */
/* global BigInt */

const express = require('express');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const REQUIRED_ZEGO_APP_ID = 1460432965;

function getZegoConfigStatus() {
  const configuredAppId = process.env.ZEGO_APP_ID || String(REQUIRED_ZEGO_APP_ID);
  const parsedAppId = Number(configuredAppId);
  const appIdValid =
    Number.isInteger(parsedAppId) && parsedAppId === REQUIRED_ZEGO_APP_ID;
  const secret = process.env.ZEGO_SERVER_SECRET || '';
  const secretConfigured = Boolean(secret);
  const secretValid = secretConfigured && secret.length === 32;
  const errors = [];

  if (!process.env.ZEGO_APP_ID) {
    errors.push('ZEGO_APP_ID is missing; using default 1460432965.');
  } else if (!appIdValid) {
    errors.push('ZEGO_APP_ID must be 1460432965.');
  }

  if (!secretConfigured) {
    errors.push('ZEGO_SERVER_SECRET is missing.');
  } else if (!secretValid) {
    errors.push('ZEGO_SERVER_SECRET is invalid.');
  }

  return {
    appId: appIdValid ? parsedAppId : REQUIRED_ZEGO_APP_ID,
    appIdValid,
    secretConfigured,
    secretValid,
    ready: appIdValid && secretValid,
    errors,
  };
}

function logZegoConfigAtStartup() {
  const status = getZegoConfigStatus();
  const logger = status.ready ? console.log : console.warn;

  logger('[ZEGOCLOUD] server config', {
    appId: status.appId,
    appIdValid: status.appIdValid,
    serverSecretConfigured: status.secretConfigured,
    serverSecretValid: status.secretValid,
    ready: status.ready,
    errors: status.errors,
  });
}

// Official ZEGOCLOUD Token04 format, matching zego_server_assistant/nodejs.
function generateToken04(appId, userId, secret, effectiveSeconds = 3600) {
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
  return { token: `04${body.toString('base64')}`, expiresAt: expireAt };
}

router.get('/token', auth, (req, res) => {
  const userId = String(req.user?._id || '');
  const secret = process.env.ZEGO_SERVER_SECRET;
  const status = getZegoConfigStatus();

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (!status.ready) {
    return res.status(503).json({ message: 'ZEGOCLOUD calling is not configured.' });
  }

  const result = generateToken04(status.appId, userId, secret);
  if (!result) {
    return res.status(503).json({ message: 'ZEGOCLOUD calling is not configured.' });
  }

  return res.set('Cache-Control', 'no-store').json({
    appId: status.appId,
    userId,
    ...result,
  });
});

module.exports = router;
module.exports.logZegoConfigAtStartup = logZegoConfigAtStartup;
