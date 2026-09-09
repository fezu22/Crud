import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

let activeCallId = null;
export const getActiveCallId = () => activeCallId;
export const setActiveCallId = id => { activeCallId = id; };

export function disconnectAfterSignal(socket, event, payload) {
    const timer = setTimeout(() => socket.disconnect(), 1500);
    socket.emit(event, payload, () => {
        clearTimeout(timer);
        socket.disconnect();
    });
}

export function createCallSocket(token) {
    const socketUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    return io(socketUrl, {
        auth: {
            token,
        },
        transports: ['websocket'],
        reconnection: true,
    });
}

export function makeCallId() {
    return `call-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
}
