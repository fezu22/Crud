import { API_BASE_URL } from '../config/apiConfig';

export const ZEGO_APP_ID = 1460432965;
const ZEGO_TOKEN_PATH = '/zego/token';
const TOKEN_ATTEMPTS = 3;
const TOKEN_TIMEOUT_MS = 18000;

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

function createTokenError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function isRetryableTokenError(error) {
  if (error?.status === 401 || error?.status === 403) return false;
  if (error?.status >= 500) return true;
  return !error?.status || error?.name === 'AbortError' || error?.code === 'timeout';
}

function validateZegoTokenResponse(body, expectedUserId) {
  if (!body?.token) {
    throw createTokenError('The call service returned no ZEGOCLOUD token.', undefined, 'missing-token');
  }

  if (Number(body.appId) !== ZEGO_APP_ID) {
    throw createTokenError('The call service returned credentials for a different ZEGOCLOUD app.', undefined, 'app-id-mismatch');
  }

  if (expectedUserId && String(body.userId || '') !== String(expectedUserId)) {
    throw createTokenError('The call service returned credentials for a different user.', undefined, 'user-id-mismatch');
  }
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
    const controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
    const timeout = controller
      ? setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
        signal: controller?.signal,
      });
      const body = await response.json().catch(() => ({}));

      logZegoRelease('token request HTTP status', {
        apiBaseUrl: API_BASE_URL,
        expectedUserId: sanitizeLogValue(expectedUserId),
        status: response.status,
        attempt,
      }, response.ok ? 'info' : 'warn');

      if (!response.ok || !body.token) {
        const error = createTokenError(
          body.message || 'Could not authorize the call service.',
          response.status,
          'http-error',
        );
        throw error;
      }

      validateZegoTokenResponse(body, expectedUserId);

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
      const timedOut = error?.name === 'AbortError';
      const safeError = timedOut
        ? createTokenError('Timed out while contacting the call token service.', undefined, 'timeout')
        : error;
      lastError = safeError;
      logZegoRelease('token request failure', {
        apiBaseUrl: API_BASE_URL,
        expectedUserId: sanitizeLogValue(expectedUserId),
        attempt,
        status: safeError?.status,
        message: String(safeError?.message || 'Token request failed.').slice(0, 180),
      }, 'warn');

      if (attempt < TOKEN_ATTEMPTS && isRetryableTokenError(safeError)) {
        await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
      } else {
        break;
      }
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Could not authorize the call service.');
}
