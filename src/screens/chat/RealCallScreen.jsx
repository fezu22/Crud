import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import CallButton, { CallLabel } from '../../components/chat/CallButton';
import { CameraIcon, MicIcon, PhoneIcon } from '../../components/chat/ChatIcons';
import { getChatTheme } from '../../theme/chatTheme';
import { formatDuration } from '../../components/chat/VoiceMessageBubble';
import { createCallSocket, makeCallId, setActiveCallId } from '../../services/callService';
import { createAgoraEngine, joinAgoraChannel, leaveAgoraChannel, destroyAgoraEngine, muteAgoraAudio, muteAgoraVideo, switchAgoraCamera, setAgoraSpeakerphone } from '../../services/agoraService';
import { requestAgoraToken, makeAgoraUid, makeCallChannel, userIdFromToken } from '../../services/agoraTokenService';

const getInitials = name => String(name || 'User').trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();

async function requestPermissions(callType) {
  if (Platform.OS !== 'android') return true;
  const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (callType === 'video') permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every(permission => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export default function RealCallScreen({ contact, token: authToken, callType = 'voice', incomingCall, onEnd, themeMode = 'dark' }) {
  const theme = getChatTheme(themeMode);
  const [status, setStatus] = useState(incomingCall ? 'connecting' : 'calling');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(callType === 'video');
  const [speakerOn, setSpeakerOn] = useState(callType === 'video');
  const [remoteUid, setRemoteUid] = useState(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const [error, setError] = useState('');
  const engineRef = useRef(null);
  const socketRef = useRef(null);
  const endedRef = useRef(false);
  const callIdRef = useRef(incomingCall?.callId || makeCallId());
  const peerUserIdRef = useRef(incomingCall?.fromUserId || contact?.id || contact?._id || '');
  const localUserId = userIdFromToken(authToken);
  const uidRef = useRef(localUserId ? makeAgoraUid(localUserId) : null);

  const finishCall = (notifyPeer = true, notifyParent = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setActiveCallId(null);
    if (notifyPeer && socketRef.current && peerUserIdRef.current) socketRef.current.emit('call:hangup', { targetUserId: peerUserIdRef.current, callId: callIdRef.current, callType });
    leaveAgoraChannel(engineRef.current);
    destroyAgoraEngine(engineRef.current);
    engineRef.current = null;
    if (notifyParent) onEnd?.();
  };

  useEffect(() => {
    let mounted = true;
    const socket = createCallSocket(authToken);
    socketRef.current = socket;
    setActiveCallId(callIdRef.current);
    const matches = data => mounted && !endedRef.current && data?.callId === callIdRef.current && (!data.fromUserId || String(data.fromUserId) === String(peerUserIdRef.current));
    const onEnded = data => { if (matches(data)) finishCall(false); };
    socket.on('call:hangup', onEnded);
    socket.on('call:rejected', onEnded);
    socket.on('call:unavailable', data => { if (matches(data)) { setError('This user is unavailable.'); finishCall(false); } });
    socket.on('connect_error', e => mounted && setError(e.message || 'Call server connection failed.'));
    const start = async () => {
      try {
        if (!(await requestPermissions(callType))) throw new Error('Camera and microphone permission is required.');
        const channelName = makeCallChannel(incomingCall?.conversationId, callIdRef.current);
        console.log('[Agora] token request', { channelName, uid: uidRef.current });
        const session = await requestAgoraToken(authToken, channelName, uidRef.current);
        if (!mounted || endedRef.current) return;
        const engine = createAgoraEngine(session.appId);
        engineRef.current = engine;
        const handler = {
          onJoinChannelSuccess: (_connection, joinedUid) => { console.log('[Agora] join success', joinedUid); setStatus('connected'); },
          onUserJoined: (_connection, uid) => { console.log('[Agora] remote user joined', uid); setRemoteUid(uid); setRemoteVideoOn(callType === 'video'); },
          onUserOffline: (_connection, uid) => { console.log('[Agora] remote user offline', uid); setRemoteUid(current => current === uid ? null : current); setRemoteVideoOn(false); },
          onRemoteVideoStateChanged: (_connection, uid, state, reason) => { console.log('[Agora] remote video state', { uid, state, reason }); setRemoteUid(uid); setRemoteVideoOn(state === 1 || state === 2); },
          onLeaveChannel: () => console.log('[Agora] left channel'),
          onError: err => { console.error('[Agora] error', err); if (mounted) setError(`Agora error ${err}`); },
          onConnectionStateChanged: (_connection, state, reason) => console.log('[Agora] connectionState', state, reason),
        };
        engine.registerEventHandler(handler);
        joinAgoraChannel(engine, session.token, channelName, uidRef.current, callType === 'video');
        if (incomingCall) socket.emit('call:accept', { targetUserId: incomingCall.fromUserId, callId: callIdRef.current, callType, conversationId: incomingCall.conversationId });
        else socket.emit('call:invite', { targetUserId: peerUserIdRef.current, callId: callIdRef.current, callType, conversationId: contact?.conversationId });
      } catch (e) { console.error('[Agora] start failed', e); if (mounted) { setError(e.message || 'Could not start call.'); Alert.alert('Call unavailable', e.message || 'Could not start call.'); finishCall(false); } }
    };
    start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => { finishCall(true); return true; });
    return () => { mounted = false; back.remove(); socket.off('call:hangup', onEnded); socket.off('call:rejected', onEnded); socket.disconnect(); if (!endedRef.current) finishCall(true, false); };
  // Call identity is immutable for this mounted call screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (status !== 'connected') return undefined; const timer = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(timer); }, [status]);
  const name = contact?.name || incomingCall?.fromName || 'Medi user';
  const toggleMute = () => { const next = !muted; muteAgoraAudio(engineRef.current, next); setMuted(next); };
  const toggleCamera = () => { const next = !cameraOn; muteAgoraVideo(engineRef.current, !next); setCameraOn(next); };
  const statusText = error || (status === 'calling' ? 'Calling...' : status === 'connected' ? `Connected - ${formatDuration(seconds)}` : 'Connecting...');
  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <StatusBar barStyle={theme.barStyle} backgroundColor={theme.background} />
    {callType === 'video' && remoteUid && remoteVideoOn ? <RtcSurfaceView testID="remote-call-video" canvas={{ uid: remoteUid }} style={styles.remoteVideo} zOrderOnTop={false} /> : <View style={styles.waiting}><View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={styles.avatarText}>{getInitials(name)}</Text></View><Text style={[styles.name, { color: theme.ink }]}>{name}</Text>{callType === 'video' && <Text style={[styles.status, { color: theme.muted }]}>{status === 'connected' ? 'Waiting for the other person video' : 'Joining video call...'}</Text>}</View>}
    {callType === 'video' && cameraOn ? <RtcSurfaceView testID="local-call-video" canvas={{ uid: 0 }} style={styles.localVideo} zOrderMediaOverlay /> : null}
    <View style={styles.info}><Text style={[styles.status, { color: theme.muted }]}>{statusText}</Text>{status !== 'connected' && !error && <ActivityIndicator color={theme.primary} style={styles.loader} />}</View>
    <View style={styles.controls}><View style={styles.controlGroup}><CallButton active={muted} activeColor={theme.surface} inactiveColor={theme.surfaceAlt} onPress={toggleMute} accessibilityLabel="Mute"><MicIcon color={muted ? theme.primary : theme.ink} size={22} /></CallButton><CallLabel color={theme.muted}>{muted ? 'Unmute' : 'Mute'}</CallLabel></View>{callType === 'video' && <View style={styles.controlGroup}><CallButton active={!cameraOn} activeColor={theme.surface} inactiveColor={theme.surfaceAlt} onPress={toggleCamera} accessibilityLabel="Camera"><CameraIcon color={!cameraOn ? theme.primary : theme.ink} size={22} /></CallButton><CallLabel color={theme.muted}>{cameraOn ? 'Camera on' : 'Camera off'}</CallLabel></View>}<View style={styles.controlGroup}><CallButton active={speakerOn} activeColor={theme.primary} inactiveColor={theme.surfaceAlt} onPress={() => { setAgoraSpeakerphone(engineRef.current, !speakerOn); setSpeakerOn(v => !v); }} accessibilityLabel="Speaker"><Text style={{ color: theme.ink, fontSize: 20 }}>O</Text></CallButton><CallLabel color={theme.muted}>{speakerOn ? 'Speaker on' : 'Speaker off'}</CallLabel></View></View>
    {callType === 'video' && <TouchableOpacity style={styles.switch} onPress={() => switchAgoraCamera(engineRef.current)}><Text style={{ color: '#fff' }}>Switch camera</Text></TouchableOpacity>}
    <View style={styles.endRow}><TouchableOpacity style={styles.endButton} onPress={() => finishCall(true)} accessibilityLabel="End call"><View style={{ transform: [{ rotate: '135deg' }] }}><PhoneIcon color="#FFFFFF" size={24} /></View></TouchableOpacity></View>
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, overflow: 'hidden' }, remoteVideo: { ...StyleSheet.absoluteFillObject }, localVideo: { position: 'absolute', top: 58, right: 16, width: 112, height: 164, zIndex: 2 }, waiting: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }, avatar: { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, avatarText: { color: '#fff', fontSize: 36, fontWeight: '900' }, name: { fontSize: 24, fontWeight: '900' }, info: { position: 'absolute', top: 150, left: 0, right: 0, alignItems: 'center' }, status: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 30 }, loader: { marginTop: 14 }, controls: { position: 'absolute', bottom: 105, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 18 }, controlGroup: { alignItems: 'center' }, switch: { position: 'absolute', top: 235, alignSelf: 'center', padding: 10 }, endRow: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' }, endButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' } });
