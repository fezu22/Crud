const express = require('express');
const auth = require('../middleware/auth');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const router = express.Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const uidForUser = value => { let hash = 2166136261; for (const char of String(value || '')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return (hash >>> 0) & 0x7fffffff || 1; };

router.get('/token', auth, (req, res) => {
  const { AGORA_APP_ID: appId, AGORA_APP_CERTIFICATE: certificate } = process.env;
  const channelName = typeof req.query.channelName === 'string' ? req.query.channelName : '';
  const requestedUid = Number(req.query.uid);
  if (!appId || !certificate) return res.status(503).json({ message: 'Agora server credentials are not configured.' });
  if (![appId, certificate].every(value => /^[a-f0-9]{32}$/i.test(value))) return res.status(503).json({ message: 'Agora server credentials are invalid.' });
  if (!/^[A-Za-z0-9 !#$%&()+\-:;<=.?@[\]^_{|}~,]{1,63}$/.test(channelName)) return res.status(400).json({ message: 'Invalid channel name.' });
  const uid = uidForUser(req.user._id);
  if (typeof req.query.uid !== 'string' || !/^\d+$/.test(req.query.uid) || !Number.isInteger(requestedUid) || requestedUid !== uid) return res.status(403).json({ message: 'Invalid Agora uid.' });
  const expire = Math.floor(Date.now() / 1000) + 3600;
  // agora-token v2 takes durations in seconds, not Unix timestamps.
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, certificate, channelName, uid, RtcRole.PUBLISHER, 3600, 3600);
  if (!rtcToken) return res.status(500).json({ message: 'Could not generate an Agora token.' });
  console.log('[Agora] token issued', { userId: String(req.user._id), channelName, uid });
  res.set('Cache-Control', 'no-store').json({ appId, token: rtcToken, channelName, uid, expiresAt: expire });
});

router.use((req, res) => res.status(404).json({ message: 'Agora endpoint not found.' }));
router.use((err, req, res, next) => {
  console.error('[Agora] token generation failed', { name: err.name });
  res.status(500).json({ message: 'Could not generate an Agora token.' });
});

module.exports = router;
