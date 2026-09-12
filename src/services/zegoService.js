import { API_BASE_URL } from '../config/apiConfig';

export const ZEGO_APP_ID = 1460432965;
const ZEGO_TOKEN_PATH = '/zego/token';
const TOKEN_ATTEMPTS = 3;

function sanitizeLogValue(value) {
  return value ? String(value).slice(0, 80) : '';
}

function logZegoRelease(stage, details = {}, level = 'info') {
  const logger = level === 'warn' ? console.warn : console.info;

  logger('[ZEGOCLOUD][release-check]', {
    stage,
    ...details,
  });
}

export function getZegoUserId(user) {
  const id = user?._id || user?.id;
  if (!id) throw new Error('A valid authenticated user is required for calling.');
  return String(id).replace(/[^A-Za-z0-9_]/g, '_');
}

export function getZegoUserName(user) {
  return String(user?.name || user?.displayName || user?.email || 'Medi user');
}

export async function requestZegoToken(authToken, expectedUserId) {
  if (!authToken) throw new Error('Please sign in again before starting a call.');

  const endpoint = `${API_BASE_URL}${ZEGO_TOKEN_PATH}`;
  let lastError;

  logZegoRelease('token request start', {
    apiBaseUrl: API_BASE_URL,
    expectedUserId: sanitizeLogValue(expectedUserId),
  });

  for (let attempt = 1; attempt <= TOKEN_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.token) {
        const error = new Error(body.message || 'Could not authorize the call service.');
        error.status = response.status;
        throw error;
      }

      logZegoRelease('token request success', {
        apiBaseUrl: API_BASE_URL,
        appId: body.appId,
        userId: sanitizeLogValue(body.userId),
        expectedUserId: sanitizeLogValue(expectedUserId),
        expiresAt: body.expiresAt,
        attempt,
      });

      return body;
    } catch (error) {
      lastError = error;
      logZegoRelease('token request failure', {
        apiBaseUrl: API_BASE_URL,
        expectedUserId: sanitizeLogValue(expectedUserId),
        attempt,
        status: error?.status,
        message: String(error?.message || 'Token request failed.').slice(0, 180),
      }, 'warn');

      if (attempt < TOKEN_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
      }
    }
  }

  throw lastError || new Error('Could not authorize the call service.');
}
