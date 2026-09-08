import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { disconnectAfterSignal, getIceServers, getActiveCallId, setActiveCallId } from '../src/services/callService';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('../src/config/apiConfig', () => ({ API_BASE_URL: 'https://example.test/api' }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.useRealTimers(); setActiveCallId(null); });

describe('call signaling lifecycle', () => {
  test('waits for hangup acknowledgement before disconnecting', () => {
    jest.useFakeTimers();
    const socket = { emit: jest.fn(), disconnect: jest.fn() };
    disconnectAfterSignal(socket, 'call:hangup', { callId: 'one' });
    expect(socket.disconnect).not.toHaveBeenCalled();
    socket.emit.mock.calls[0][2]();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    jest.runAllTimers();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
  test('disconnects even when an old server does not acknowledge', () => {
    jest.useFakeTimers();
    const socket = { emit: jest.fn(), disconnect: jest.fn() };
    disconnectAfterSignal(socket, 'call:hangup', {});
    jest.advanceTimersByTime(1500);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
  test('loads authenticated relay configuration', async () => {
    const iceServers = [{ urls: 'turn:relay.test:3478', username: 'user', credential: 'test' }];
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ iceServers }) }));
    expect(await getIceServers('token')).toEqual(iceServers);
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  });
  test('falls back when the production server is still on the old API', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 404 }));
    expect(await getIceServers('token')).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });
  test('tracks busy state and clears it at call end', () => {
    setActiveCallId('one');
    expect(getActiveCallId()).toBe('one');
    setActiveCallId(null);
    expect(getActiveCallId()).toBeNull();
  });
});
