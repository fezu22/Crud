import { API_BASE_URL } from '../config/apiConfig';

export const ZEGO_APP_ID = 60432965;

export function getZegoUserId(user) {
  const id = user?._id || user?.id;
  if (!id) throw new Error('A valid authenticated user is required for calling.');
  return String(id).replace(/[^A-Za-z0-9_]/g, '_');
}

export function getZegoUserName(user) {
  return String(user?.name || user?.displayName || user?.email || 'Medi user');
}

export async function requestZegoToken(authToken) {
  if (!authToken) throw new Error('Please sign in again before starting a call.');
  const response = await fetch(`${API_BASE_URL}/zego/token`, {
    headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.token) throw new Error(body.message || 'Could not authorize the call service.');
  return body;
}
