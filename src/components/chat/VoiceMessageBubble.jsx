import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Sound from 'react-native-nitro-sound';

const BAR_COUNT = 30;

function hashCode(value) {
  let hash = 0;
  const text = String(value || 'wave');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return hash;
}

/** Deterministic pseudo-random waveform so each message always looks the same. */
export function seededWaveform(seed) {
  let state = hashCode(seed) || 7;
  return Array.from({ length: BAR_COUNT }, () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return 0.25 + (state % 1000) / 1000 * 0.75;
  });
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
}

/**
 * Voice-message bubble with waveform, play/pause, duration and progress.
 */
export default function VoiceMessageBubble({ message, mine, theme, token }) {
  const duration = Math.max(1, Math.round(message.duration || 1));
  const bars = useMemo(
    () =>
      message.waveform?.length
        ? message.waveform
        : seededWaveform(message._id || String(duration)),
    [message._id, message.waveform, duration],
  );
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const waveformProgress = useRef(new Animated.Value(0)).current;
  const source = message.attachmentUrl || message.audioUrl || message.uri;

  useEffect(() => () => {
    Sound.removePlaybackEndListener?.();
    Sound.removePlayBackListener?.();
    Sound.stopPlayer().catch(() => {});
  }, []);

  useEffect(() => {
    if (!playing) {
      waveformProgress.stopAnimation();
      waveformProgress.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(waveformProgress, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(waveformProgress, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [playing, waveformProgress]);

  const toggle = async () => {
    if (playing) {
      await Sound.stopPlayer().catch(() => {});
      Sound.removePlayBackListener?.();
      setPlaying(false);
      return;
    }

    if (!source) return;
    if (elapsed >= duration) setElapsed(0);

    try {
      Sound.addPlayBackListener(progressEvent => {
        const nextSeconds = Math.min(
          duration,
          Number(progressEvent.currentPosition || 0) / 1000,
        );
        setElapsed(nextSeconds);
      });
      Sound.addPlaybackEndListener(() => {
        Sound.removePlayBackListener?.();
        setElapsed(duration);
        setPlaying(false);
      });
      await Sound.startPlayer(
        source,
        token ? { Authorization: `Bearer ${token}` } : undefined,
      );
      setPlaying(true);
    } catch {
      Sound.removePlayBackListener?.();
      setPlaying(false);
    }
  };

  const playedColor = mine ? '#C9BCFF' : theme.primary;
  const idleColor = mine ? 'rgba(255,255,255,0.45)' : theme.line;
  const progress = elapsed / duration;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={toggle}
        style={[styles.playButton, { backgroundColor: mine ? 'rgba(255,255,255,0.18)' : theme.primary }]}
        accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}>
        {playing ? (
          <View style={styles.pauseBars}>
            <View style={[styles.pauseBar, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.pauseBar, { backgroundColor: '#FFFFFF' }]} />
          </View>
        ) : (
          <View style={styles.playGlyph} />
        )}
      </TouchableOpacity>

      <View>
        <View style={[styles.wave, mine ? null : { opacity: 0.95 }]}>
          {bars.map((level, index) => {
            const played = index / bars.length <= progress;
            const scale = waveformProgress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.72 + level * 0.18, 1.08, 0.72 + level * 0.18],
            });
            return (
              <Animated.View
                key={index}
                style={{
                  width: 3,
                  borderRadius: 2,
                  marginRight: 2,
                  height: 6 + level * 20,
                  backgroundColor: played ? playedColor : idleColor,
                  transform: [{ scaleY: playing ? scale : 1 }],
                }}
              />
            );
          })}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: mine ? 'rgba(234,247,242,0.8)' : theme.muted }]}>
            {formatDuration(playing ? elapsed : duration)}
          </Text>
          {playing ? (
            <Text style={[styles.time, { color: mine ? 'rgba(234,247,242,0.55)' : theme.muted }]}>
              {' / '}
              {formatDuration(duration)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playGlyph: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 2,
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 2,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
  },
});
