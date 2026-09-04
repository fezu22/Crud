import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CallButton, { CallLabel } from '../../components/chat/CallButton';
import { MicIcon, PhoneIcon } from '../../components/chat/ChatIcons';
import { chatThemes } from '../../theme/chatTheme';
import { formatDuration } from '../../components/chat/VoiceMessageBubble';

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

function SpeakerIcon({ color, size = 22 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.speakerCone, { borderRightColor: color }]} />
      <View style={[styles.speakerArc, { borderTopColor: color, borderLeftColor: color }]} />
    </View>
  );
}

function KeypadIcon({ color }) {
  const dot = { width: 4, height: 4, borderRadius: 2, backgroundColor: color };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 20, gap: 4, justifyContent: 'center' }}>
      {Array.from({ length: 9 }, (_, index) => (
        <View key={index} style={dot} />
      ))}
    </View>
  );
}

/**
 * Mock voice call: emerald gradient backdrop, live status, mute/speaker/
 * keypad/end controls. No WebRTC backend exists yet, so the call simulates
 * ringing and a running duration locally and always stays responsive.
 */
export default function VoiceCallScreen({ contact, onEnd }) {
  const theme = chatThemes.dark;
  const [status, setStatus] = useState('calling');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [dialed, setDialed] = useState('');
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const ring = setTimeout(() => setStatus('connected'), 4200);
    return () => clearTimeout(ring);
  }, []);

  useEffect(() => {
    if (status !== 'connected') return undefined;
    const id = setInterval(() => setSeconds(current => current + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === 'connected') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const statusText =
    status === 'calling' ? 'Calling…' : `Connected · ${formatDuration(seconds)}`;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={theme.outgoingBase} />
      <View style={[styles.backdrop, { backgroundColor: theme.outgoingBase }]} />
      <View style={[styles.glowTop, { backgroundColor: theme.greenLight }]} />
      <View style={[styles.glowBottom, { backgroundColor: theme.green }]} />

      <View style={styles.identityArea}>
        <View style={styles.avatarWrap}>
          {status !== 'connected' ? (
            <Animated.View style={[styles.avatarPulse, { opacity: pulse }]} />
          ) : null}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(contact?.name || 'Dr')
                .split(' ')
                .map(part => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{contact?.name || 'Dr. Ahmad'}</Text>
        <Text style={styles.status}>{statusText}</Text>
        <Text style={styles.specialty}>{contact?.specialty || 'Cardiologist'}</Text>
      </View>

      {keypadOpen ? (
        <View style={styles.keypadCard}>
          <Text style={styles.dialed}>{dialed || ' '}</Text>
          <View style={styles.keyGrid}>
            {KEYPAD_KEYS.map(key => (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => setDialed(current => (current + key).slice(0, 14))}>
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <CallButton
            active={muted}
            onPress={() => setMuted(current => !current)}
            accessibilityLabel="Mute">
            <MicIcon color={muted ? '#059669' : '#FFFFFF'} size={22} />
          </CallButton>
          <CallLabel>{muted ? 'Unmute' : 'Mute'}</CallLabel>
        </View>
        <View style={styles.controlGroup}>
          <CallButton
            active={speaker}
            onPress={() => setSpeaker(current => !current)}
            accessibilityLabel="Speaker">
            <SpeakerIcon color={speaker ? '#059669' : '#FFFFFF'} size={22} />
          </CallButton>
          <CallLabel>{speaker ? 'Speaker on' : 'Speaker'}</CallLabel>
        </View>
        <View style={styles.controlGroup}>
          <CallButton
            active={keypadOpen}
            onPress={() => setKeypadOpen(current => !current)}
            accessibilityLabel="Keypad">
            <KeypadIcon color={keypadOpen ? '#059669' : '#FFFFFF'} />
          </CallButton>
          <CallLabel>Keypad</CallLabel>
        </View>
      </View>

      <View style={styles.endRow}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={onEnd}
          accessibilityLabel="End call">
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    left: -110,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.5,
  },
  identityArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  avatarWrap: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  avatarPulse: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  status: {
    color: 'rgba(209, 250, 229, 0.9)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  specialty: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 4,
  },
  keypadCard: {
    backgroundColor: 'rgba(6, 24, 18, 0.55)',
    marginHorizontal: 34,
    marginBottom: 10,
    borderRadius: 22,
    padding: 16,
  },
  dialed: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    minHeight: 30,
    letterSpacing: 2,
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  key: {
    width: 64,
    height: 52,
    margin: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 34,
    marginBottom: 26,
  },
  controlGroup: {
    alignItems: 'center',
  },
  endRow: {
    alignItems: 'center',
    marginBottom: 46,
  },
  endButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  speakerCone: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  speakerArc: {
    width: 9,
    height: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
    marginLeft: -2,
  },
});
