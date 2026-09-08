import React from 'react';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';
import IncomingCallHost from '../src/components/chat/IncomingCallHost';
import { createCallSocket, getActiveCallId } from '../src/services/callService';

jest.mock('../src/screens/chat/RealCallScreen', () => () => null);
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../src/services/callService', () => ({ createCallSocket: jest.fn(), getActiveCallId: jest.fn() }));

let handlers;
let socket;
let renderer;
const call = { callId: 'incoming-one', fromUserId: 'other', fromName: 'Other', callType: 'video' };
beforeEach(async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
  handlers = {};
  socket = { on: (event, callback) => { handlers[event] = callback; }, emit: jest.fn(), disconnect: jest.fn() };
  createCallSocket.mockReturnValue(socket);
  getActiveCallId.mockReturnValue(null);
  await act(async () => { renderer = TestRenderer.create(<IncomingCallHost token="token" themeMode="dark" />); });
});
afterEach(async () => { await act(async () => renderer.unmount()); jest.useRealTimers(); });

test('rings outside the thread and closes when the caller hangs up', async () => {
  await act(async () => handlers['call:incoming'](call));
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Answer call' }).length).toBeGreaterThan(0);
  await act(async () => handlers['call:hangup']({ callId: 'different', fromUserId: 'other' }));
  expect(JSON.stringify(renderer.toJSON())).toContain('Other');
  await act(async () => handlers['call:hangup'](call));
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Other');
});

test('rejects a new caller when already busy', async () => {
  getActiveCallId.mockReturnValue('outgoing-one');
  await act(async () => handlers['call:incoming'](call));
  expect(socket.emit).toHaveBeenCalledWith('call:reject', { targetUserId: 'other', callId: call.callId });
});

test('expires unanswered ringing and releases the busy state', async () => {
  await act(async () => handlers['call:incoming'](call));
  await act(async () => jest.advanceTimersByTime(45000));
  expect(socket.emit).toHaveBeenCalledWith('call:reject', { targetUserId: 'other', callId: call.callId });
  await act(async () => handlers['call:incoming']({ ...call, callId: 'next' }));
  expect(JSON.stringify(renderer.toJSON())).toContain('Other');
});
