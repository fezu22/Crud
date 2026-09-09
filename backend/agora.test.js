const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { AccessToken2 } = require('agora-token/src/AccessToken2');
// Isolate the route from MongoDB; authentication behavior is unchanged.
require.cache[require.resolve('./middleware/auth')] = { exports: (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ message: 'Authentication required' });
  req.user = { _id: 'alice' }; next();
} };
const router = require('./routes/agoraRoutes');
test('Agora route returns JSON and builds a one-hour RTC token', async () => {
  const app = express();
  app.use('/api/agora', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const saved = [process.env.AGORA_APP_ID, process.env.AGORA_APP_CERTIFICATE];
  const request = async (path, authenticated = true) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/agora/${path}`, { headers: authenticated ? { Authorization: 'Bearer test' } : {} });
    assert.match(response.headers.get('content-type'), /application\/json/);
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal((await request('token', false)).status, 401);
    assert.equal((await request('missing')).status, 404);
    delete process.env.AGORA_APP_ID;
    assert.equal((await request('token?channelName=test&uid=123')).status, 503);
    process.env.AGORA_APP_ID = 'a'.repeat(32);
    process.env.AGORA_APP_CERTIFICATE = 'b'.repeat(32);
    let hash = 2166136261;
    for (const char of 'alice') hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const uid = ((hash >>> 0) & 0x7fffffff) || 1;
    assert.equal((await request(`token?uid=${uid}`)).status, 400);
    assert.equal((await request('token?channelName=test&uid=123')).status, 403);
    const result = await request(`token?channelName=test&uid=${uid}`);
    assert.equal(result.status, 200);
    assert.equal(result.body.uid, uid);
    assert.equal(result.body.channelName, 'test');
    const parsed = new AccessToken2();
    assert.ok(parsed.from_string(result.body.token));
    assert.equal(parsed.expire, 3600);
    assert.equal(String(parsed.services[0].__channel_name), 'test');
    assert.equal(String(parsed.services[0].__uid), String(uid));
  } finally {
    ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'].forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i];
    });
    await new Promise(resolve => server.close(resolve));
  }
});
