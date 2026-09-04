import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CallButton, { CallLabel } from '../../components/chat/CallButton';
import { CameraIcon, MicIcon, PhoneIcon } from '../../components/chat/ChatIcons';
import { chatThemes } from '../../theme/chatTheme';
import { formatDuration } from '../../components/chat/VoiceMessageBubble';

function SwitchCameraIcon({ color }) {
  const arrow = { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' };
  return (
    <View style={{ width: 30, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.switchBar, { backgroundColor: color }]} />
        <View style={[arrow, { borderTopColor: color, transform: [{ rotate: '90deg' }] }]} />
        <View style={[arrow, { borderTopColor: color, transform: [{ rotate: '-90deg' }] }]} />
      </View>
    </View>
  );
}

/**
 * Mock video call: full-screen "remote video" placeholder, small self
 * preview card and camera/mic controls. WebRTC is not configured, so the
 * screen simulates connecting, requests the real permissions and keeps
 * working even when they are denied.
 */
export default function VideoCallScreen({ contact, onEnd }) {
  const theme = chatThemes.dark;
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [speaker, setSpeaker] = useState(true);
  const [frontCamera, setFrontCamera] = useState(true);
  const [permissionNote, setPermissionNote] = useState('');

  useEffect(() => {
    const request = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (results[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED) {
          setCameraOn(false);
          setPermissionNote('Camera permission denied');
        } else if (results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionNote('Microphone permission denied');
        }
      } catch (error) {
        setPermissionNote('Permissions unavailable');
      }
    };
    request();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setConnected(true), 3600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!connected) return undefined;
    const id = setInterval(() => setSeconds(current => current + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  const statusText = connected
    ? `Connected · ${formatDuration(seconds)}`
    : 'Connecting…';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#04070C" />
      <View style={[styles.remote, { backgroundColor: theme.outgoingBase }]} />
      <View style={styles.remoteGlow} />

      <View style={styles.remoteCenter}>
        {cameraOn && connected ? (
          <View style={styles.videoPlaceholder}>
            <View style={[styles.videoBadge, { backgroundColor: theme.greenLight }]} />
            <Text style={styles.videoBadgeText}>LIVE</Text>
          </View>
        ) : null}
        <View style={styles.remoteAvatar}>
          <Text style={styles.remoteAvatarText}>
            {(contact?.name || 'Dr')
              .split(' ')
              .map(part => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{contact?.name || 'Dr. Ahmad'}</Text>
        <Text style={styles.status}>{statusText}</Text>
        {permissionNote ? <Text style={styles.note}>{permissionNote}</Text> : null}
      </View>

      <View style={styles.selfPreview}>
        {cameraOn ? (
          <View style={styles.selfCamera}>
            <CameraIcon color="rgba(255,255,255,0.8)" size={20} />
            <Text style={styles.selfLabel}>{frontCamera ? 'Front camera' : 'Back camera'}</Text>
          </View>
        ) : (
          <View style={styles.selfCameraOff}>
            <Text style={{ fontSize: 18 }}>🚫</Text>
            <Text style={styles.selfLabel}>Camera off</Text>
          </View>
        )}
        <Text style={styles.selfTag}>You</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <CallButton active={muted} onPress={() => setMuted(current => !current)} accessibilityLabel="Mute">
            <MicIcon color={muted ? '#059669' : '#FFFFFF'} size={22} />
          </CallButton>
          <CallLabel>{muted ? 'Unmute' : 'Mute'}</CallLabel>
        </View>
        <View style={styles.controlGroup}>
          <CallButton active={!cameraOn} onPress={() => setCameraOn(current => !current)} accessibilityLabel="Camera">
            <CameraIcon color={!cameraOn ? '#059669' : '#FFFFFF'} size={22} />
          </CallButton>
          <CallLabel>{cameraOn ? 'Camera on' : 'Camera off'}</CallLabel>
        </View>
        <View style={styles.controlGroup}>
          <CallButton onPress={() => setFrontCamera(current => !current)} accessibilityLabel="Switch camera">
            <SwitchCameraIcon color="#FFFFFF" />
          </CallButton>
          <CallLabel>Switch</CallLabel>
        </View>
        <View style={styles.controlGroup}>
          <CallButton active={speaker} onPress={() => setSpeaker(current => !current)} accessibilityLabel="Speaker">
            <Text style={{ color: speaker ? '#059669' : '#FFFFFF', fontSize: 17, fontWeight: '900' }}>◉</Text>
          </CallButton>
          <CallLabel>{speaker ? 'Speaker on' : 'Speaker'}</CallLabel>
        </View>
      </View>

      <View style={styles.endRow}>
        <TouchableOpacity style={styles.endButton} onPress={onEnd} accessibilityLabel="End call">
          <View style={{ transform: [{ rotate: '135deg' }] }}>
            <PhoneIcon color="#FFFFFF" size={24} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  remote: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteGlow: {
    position: 'absolute',
    top: -130,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  remoteCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  videoPlaceholder: {
    position: 'absolute',
    top: 74,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 7, 12, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  videoBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  remoteAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteAvatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
  },
  status: {
    color: 'rgba(209, 250, 229, 0.9)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  note: {
    color: 'rgba(255, 235, 235, 0.85)',
    fontSize: 11,
    marginTop: 6,
  },
  selfPreview: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 104,
    height: 148,
    borderRadius: 16,
    backgroundColor: '#0C1822',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  selfCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  selfCameraOff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selfLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  selfTag: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlGroup: {
    alignItems: 'center',
  },
  endRow: {
    alignItems: 'center',
    marginBottom: 42,
  },
  endButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  switchBar: {
    width: 9,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
