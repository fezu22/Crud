import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/apiConfig';

let activeCallId = null;
export const getActiveCallId = () => activeCallId;
export const setActiveCallId = id => { activeCallId = id; };

export async function getIceServers(token) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(`${API_BASE_URL}/chat/ice-servers`, {
            headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        // Keep older production servers compatible. TURN improves reliability,
        // but a missing optional endpoint must not prevent a direct call.
        if (!response.ok) {
            return [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ];
        }
        const data = await response.json();
        return Array.isArray(data.iceServers) && data.iceServers.length
            ? data.iceServers
            : [{ urls: 'stun:stun.l.google.com:19302' }];
    } catch (error) {
        if (error?.name === 'AbortError' || error instanceof TypeError) {
            return [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ];
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

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
