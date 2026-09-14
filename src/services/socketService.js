import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

let sharedSocket = null;
let sharedToken = null;

function logSocketRuntime(stage, details = {}) {
  console.info('[RUNTIME] socket', {
    stage,
    ...details,
  });
}

export function createSocket(token) {
  if (!token) return null;
  if (sharedSocket && sharedToken === token) {
    if (sharedSocket.disconnected) {
      logSocketRuntime('connect requested for existing socket');
      sharedSocket.connect();
    }
    return sharedSocket;
  }

  disconnectSocket();
  sharedToken = token;
  sharedSocket = io(API_BASE_URL.replace(/\/api\/?$/, ''), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
    pingTimeout: 30000,
    pingInterval: 25000,
  });
  sharedSocket.on('connect', () => logSocketRuntime('connected', { id: sharedSocket?.id }));
  sharedSocket.on('disconnect', reason => logSocketRuntime('disconnected', { reason }));
  sharedSocket.io?.on('reconnect', attempt => logSocketRuntime('reconnected', { attempt }));
  sharedSocket.io?.on('reconnect_attempt', attempt => logSocketRuntime('reconnect attempt', { attempt }));
  sharedSocket.io?.on('reconnect_error', error => logSocketRuntime('reconnect error', {
    message: String(error?.message || 'Reconnect failed.').slice(0, 160),
  }));
  return sharedSocket;
}

export function reconnectSocket(token) {
  const socket = createSocket(token);
  if (!socket) return null;
  if (socket.disconnected) {
    logSocketRuntime('foreground reconnect requested');
    socket.connect();
  } else {
    logSocketRuntime('foreground socket already connected', { id: socket.id });
  }
  return socket;
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.io?.removeAllListeners?.();
    sharedSocket.disconnect();
  }
  sharedSocket = null;
  sharedToken = null;
}
