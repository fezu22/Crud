import React from 'react';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { PermissionsAndroid } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { RTCPeerConnection, RTCView } from 'react-native-webrtc';
import RealCallScreen from '../src/screens/chat/RealCallScreen';
import { createCallSocket } from '../src/services/callService';

jest.mock('../src/components/chat/VoiceMessageBubble', () => ({ formatDuration: seconds => String(seconds) }));
jest.mock('../src/services/callService', () => ({
  createCallSocket: jest.fn(), makeCallId: () => 'test-call', setActiveCallId: jest.fn(),
  getIceServers: jest.fn(async () => [{ urls: 'stun:test' }]),
  disconnectAfterSignal: jest.fn(),
}));
jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCIceCandidate: function(candidate) { Object.assign(this, candidate); },
  RTCSessionDescription: function(description) { Object.assign(this, description); },
  RTCView: () => null,
  MediaStream: function(tracks = []) { this.getTracks = () => tracks; this.addTrack = track => tracks.push(track); this.toURL = () => 'remote'; },
  mediaDevices: { getUserMedia: jest.fn(async () => ({ getTracks: () => [], toURL: () => 'local' })) },
}));

let handlers;
let peer;
let renderer;
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
  handlers = {};
  createCallSocket.mockReturnValue({
    on: (event, callback) => { handlers[event] = callback; }, emit: jest.fn(), disconnect: jest.fn(),
  });
  peer = {
    addTrack: jest.fn(), close: jest.fn(), addIceCandidate: jest.fn(async () => {}),
    setRemoteDescription: jest.fn(async () => {}), setLocalDescription: jest.fn(async () => {}),
    createOffer: jest.fn(async () => ({ type: 'offer', sdp: 'local' })),
    createAnswer: jest.fn(async () => ({ type: 'answer', sdp: 'local' })),
  };
  RTCPeerConnection.mockImplementation(() => peer);
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockImplementation(async permissions =>
    Object.fromEntries(permissions.map(permission => [permission, PermissionsAndroid.RESULTS.GRANTED])));
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const mountCall = async onEnd => {
  await act(async () => {
    renderer = TestRenderer.create(<RealCallScreen token="token" contact={{ id: 'other', name: 'Other' }} callType="video" onEnd={onEnd} />);
  });
};
const signal = async (event, data) => {
  await act(async () => handlers[event]({ callId: 'test-call', fromUserId: 'other', ...data }));
};

test('buffers early ICE until remote SDP is applied', async () => {
  await mountCall(jest.fn());
  await signal('webrtc:ice-candidate', { candidate: { candidate: 'early' } });
  expect(peer.addIceCandidate).not.toHaveBeenCalled();
  await signal('webrtc:answer', { answer: { type: 'answer', sdp: 'remote' } });
  expect(peer.setRemoteDescription).toHaveBeenCalledTimes(1);
  expect(peer.addIceCandidate).toHaveBeenCalledWith(expect.objectContaining({ candidate: 'early' }));
});

test('ignores hangups for another call or another participant', async () => {
  const onEnd = jest.fn();
  await mountCall(onEnd);
  await signal('call:hangup', { callId: 'stale' });
  await signal('call:hangup', { fromUserId: 'unrelated' });
  expect(onEnd).not.toHaveBeenCalled();
  await signal('call:hangup', {});
  expect(onEnd).toHaveBeenCalledTimes(1);
  expect(peer.close).toHaveBeenCalledTimes(1);
});

test('does not start the connected timer merely on SDP answer', async () => {
  await mountCall(jest.fn());
  await signal('webrtc:answer', { answer: { type: 'answer', sdp: 'remote' } });
  expect(JSON.stringify(renderer.toJSON())).not.toContain('Connected');
  await act(async () => { peer.connectionState = 'connected'; peer.onconnectionstatechange(); });
  expect(JSON.stringify(renderer.toJSON())).toContain('Connected');
});

test('attaches video arriving after audio on the same native stream URL', async () => {
  await mountCall(jest.fn());
  const tracks = [{ id: 'audio', kind: 'audio' }];
  const stream = { getTracks: () => tracks, toURL: () => 'native-remote' };
  await act(async () => peer.ontrack({ streams: [stream], track: tracks[0] }));
  expect(renderer.root.findAllByType(RTCView).filter(view => view.props.testID === 'remote-call-video')).toHaveLength(0);
  tracks.push({ id: 'video', kind: 'video' });
  await act(async () => peer.ontrack({ streams: [stream], track: tracks[1] }));
  const video = renderer.root.findAllByType(RTCView).find(view => view.props.testID === 'remote-call-video');
  expect(video.props.streamURL).toBe('native-remote');
  tracks[1] = { id: 'replacement-video', kind: 'video' };
  await act(async () => peer.ontrack({ streams: [stream], track: tracks[1] }));
  const replacement = renderer.root.findAllByType(RTCView).find(view => view.props.testID === 'remote-call-video');
  expect(replacement).not.toBe(video);
});
