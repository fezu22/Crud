import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, NativeModules, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getChatIconButtonTokens } from './ChatIcons';
import { formatDuration } from './VoiceMessageBubble';
import Sound, { AudioSourceAndroidType } from 'react-native-nitro-sound';

const MAX_SECONDS = 120;
const BAR_COUNT = 30;
const { BluetoothAudioRoute } = NativeModules;

function emptyWaveform() {
  return Array.from({ length: BAR_COUNT }, () => 0.12);
}

function meteringToAmplitude(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.12;
  return Math.max(0.08, Math.min(1, (numeric + 60) / 60));
}

/**
 * Recording overlay: pulsing red indicator, running timer, cancel and send.
 * The recorder is a stable demo implementation â€” it measures real elapsed
 * time and produces a simulated voice message, without touching a
 * microphone buffer, so it cannot crash on devices without an audio module.
 */
export default function VoiceRecorderModal({ visible, theme, onCancel, onSend, onError }) {
  const [seconds, setSeconds] = useState(0);
  const [recordingPath, setRecordingPath] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [waveform, setWaveform] = useState(emptyWaveform);
  const pulse = useRef(new Animated.Value(0.35)).current;
  const intervalRef = useRef(null);
  const startupTimerRef = useRef(null);
  const onErrorRef = useRef(onError);
  const iconTokens = getChatIconButtonTokens(theme);

  onErrorRef.current = onError;

  useEffect(() => {
    if (!visible) {
      setSeconds(0);
      setRecordingPath('');
      setStarting(false);
      setStartError('');
      setWaveform(emptyWaveform());
      return undefined;
    }
    let mounted = true;
    setStarting(true);
    setStartError('');
    setWaveform(emptyWaveform());

    const startRecording = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 31) {
          const bluetoothPermission = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
          if ((await PermissionsAndroid.check(bluetoothPermission)) === false) {
            await PermissionsAndroid.request(bluetoothPermission, {
              title: 'Bluetooth audio permission',
              message: 'Medi uses connected earbuds for voice messages when available.',
              buttonPositive: 'Allow',
              buttonNegative: 'Skip',
            });
          }
        }

        await BluetoothAudioRoute?.start?.();
        Sound.setSubscriptionDuration(0.08);
        Sound.addRecordBackListener(recording => {
          if (!mounted) return;
          const amplitude = meteringToAmplitude(recording.currentMetering);
          setWaveform(current => current.map((_, index) => {
            const variation = 0.65 + ((index * 17) % 35) / 100;
            return Math.max(0.08, Math.min(1, amplitude * variation));
          }));
        });

        // Use the platform voice-processing path to reduce echo and steady
        // background noise while keeping the recording mono and lightweight.
        const audioSet = {
          AudioSamplingRate: 44100,
          AudioEncodingBitRate: 128000,
          AudioChannels: 1,
          ...(Platform.OS === 'android'
            ? { AudioSourceAndroid: AudioSourceAndroidType.VOICE_COMMUNICATION }
            : { AVModeIOS: 'voiceChat' }),
        };

        const path = await Promise.race([
          Sound.startRecorder(
            undefined,
            audioSet,
            true,
          ),
          new Promise((_, reject) => {
            startupTimerRef.current = setTimeout(() => {
              reject(new Error('Recorder startup timed out. Check microphone access and try again.'));
            }, 10000);
          }),
        ]);

        if (!mounted) return;
        setRecordingPath(path);
        setStarting(false);
        intervalRef.current = setInterval(() => {
          setSeconds(current => {
            if (current + 1 >= MAX_SECONDS) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              return MAX_SECONDS;
            }
            return current + 1;
          });
        }, 1000);
      } catch (error) {
        if (!mounted) return;
        setStarting(false);
        setStartError(error?.message || 'Could not start the microphone.');
        onErrorRef.current?.(error);
      } finally {
        if (startupTimerRef.current) {
          clearTimeout(startupTimerRef.current);
          startupTimerRef.current = null;
        }
      }
    };

    startRecording();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
      startupTimerRef.current = null;
      mounted = false;
      Sound.removeRecordBackListener();
      Sound.stopRecorder().catch(() => {});
      BluetoothAudioRoute?.stop?.();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.liveRow}>
            <View style={styles.pulseWrap}>
              <Animated.View
                style={[styles.pulse, { backgroundColor: theme.danger, opacity: pulse }]}
              />
              <View style={[styles.liveDot, { backgroundColor: theme.danger }]} />
            </View>
            <Text style={[styles.liveText, { color: theme.danger }]}>REC</Text>
          </View>

          <View style={[styles.waveCard, { backgroundColor: theme.surfaceAlt }]}>
            <View
              style={[
                styles.recordingIcon,
                {
                  backgroundColor: iconTokens.backgroundColor,
                  borderColor: iconTokens.borderColor,
                },
              ]}>
              <Image
                source={require('../../assets/microphone-black-shape.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.timer, { color: theme.ink }]}>{formatDuration(seconds)}</Text>
            <View style={styles.waveform}>
              {waveform.map((level, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height: 8 + level * 38,
                      backgroundColor: theme.primaryLight,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.hint, { color: theme.muted }]}>
              {startError || (starting ? 'Starting recorderâ€¦' : 'Recording voice messageâ€¦ speak now')}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancel, { borderColor: theme.line }]}
              onPress={async () => {
                await Sound.stopRecorder().catch(() => {});
                onCancel();
              }}>
              <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              disabled={starting || !recordingPath || Boolean(startError)}
              onPress={async () => {
                const path = await Sound.stopRecorder().catch(() => '');
                onSend(Math.max(1, seconds), {
                  uri: path || recordingPath,
                  type: 'audio/m4a',
                  fileName: `voice_${Date.now()}.m4a`,
                }, waveform);
              }}>
              <Text style={styles.sendText}>{starting ? 'Startingâ€¦' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 20,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 10,
  },
  pulseWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  waveCard: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
  },
  recordingIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    width: '100%',
    height: 54,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    width: 3,
    minHeight: 8,
    borderRadius: 3,
  },
  timer: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  cancel: {
    borderWidth: 1,
  },
  cancelText: {
    fontWeight: '700',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

