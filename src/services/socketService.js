import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

export function createSocket(token) {
  return io(API_BASE_URL.replace(/\/api\/?$/, ''), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });
}
