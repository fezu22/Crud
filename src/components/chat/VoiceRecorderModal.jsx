import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MicIcon } from './ChatIcons';
import { formatDuration } from './VoiceMessageBubble';

const MAX_SECONDS = 120;

/**
 * Recording overlay: pulsing red indicator, running timer, cancel and send.
 * The recorder is a stable demo implementation — it measures real elapsed
 * time and produces a simulated voice message, without touching a
 * microphone buffer, so it cannot crash on devices without an audio module.
 */
export default function VoiceRecorderModal({ visible, theme, onCancel, onSend }) {
  const [seconds, setSeconds] = useState(0);
  const pulse = useRef(new Animated.Value(0.35)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setSeconds(0);
      return undefined;
    }
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
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
            <MicIcon color={theme.primaryLight} size={22} />
            <Text style={[styles.timer, { color: theme.ink }]}>{formatDuration(seconds)}</Text>
            <Text style={[styles.hint, { color: theme.muted }]}>
              Recording voice message… speak now
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancel, { borderColor: theme.line }]}
              onPress={onCancel}>
              <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => onSend(Math.max(1, seconds))}>
              <Text style={styles.sendText}>Send</Text>
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
