import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

let sharedSocket = null;
let sharedToken = null;

export function createSocket(token) {
  if (!token) return null;
  if (sharedSocket && sharedToken === token) return sharedSocket;

  disconnectSocket();
  sharedToken = token;
  sharedSocket = io(API_BASE_URL.replace(/\/api\/?$/, ''), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });
  return sharedSocket;
}

export function disconnectSocket() {
  if (sharedSocket) sharedSocket.disconnect();
  sharedSocket = null;
  sharedToken = null;
}
