export const AGORA_TOKEN_URL = 'https://crud-ptx8.onrender.com/api/agora/token';

export function makeAgoraUid(value) { let hash = 2166136261; for (const char of String(value || 'local')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return (hash >>> 0) & 0x7fffffff || 1; }
export function makeCallChannel(conversationId, callId) { return `call_${callId}`.slice(0, 63); }
export function userIdFromToken(token) { try { const part = String(token || '').split('.')[1]; return JSON.parse(globalThis.atob ? globalThis.atob(part.replace(/-/g, '+').replace(/_/g, '/')) : decodeURIComponent(escape(Buffer.from(part, 'base64').toString()))).id; } catch (e) { return ''; } }
export async function requestAgoraToken(authToken, channelName, uid) {
  if (!authToken) throw new Error('Sign in before starting a call.');
  if (!channelName || !Number.isInteger(uid) || uid < 1 || uid > 0xffffffff) {
    throw new Error('Invalid Agora channel or uid.');
  }
  const response = await fetch(`${AGORA_TOKEN_URL}?channelName=${encodeURIComponent(channelName)}&uid=${uid}`, {
    headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
  });
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  console.log('[Agora] token response', { status: response.status, contentType });
  const invalidResponse = () => {
    console.error('[Agora] non-JSON token response', { status: response.status, contentType, body: text.slice(0, 300) });
    return new Error(`Call server returned an invalid response (HTTP ${response.status}). Please try again shortly.`);
  };
  if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) throw invalidResponse();
  let body;
  try { body = JSON.parse(text); } catch { throw invalidResponse(); }
  if (!response.ok) throw new Error(body?.message || `Agora token request failed (HTTP ${response.status}).`);
  if (!body?.token || !body?.appId || body.channelName !== channelName || body.uid !== uid) {
    throw new Error('Call server returned an invalid Agora session.');
  }
  return body;
}
