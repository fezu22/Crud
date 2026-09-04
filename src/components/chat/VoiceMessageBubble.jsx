import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
 * Playback is simulated against the recorded duration: there is no audio
 * recorder backend wired up yet, so this stays stable on any device.
 */
export default function VoiceMessageBubble({ message, mine, theme }) {
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
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const toggle = () => {
    if (playing) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setPlaying(false);
      return;
    }
    if (elapsed >= duration) setElapsed(0);
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setElapsed(current => {
        const next = current + 0.1;
        if (next >= duration) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setPlaying(false);
          return duration;
        }
        return next;
      });
    }, 100);
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
            return (
              <View
                key={index}
                style={{
                  width: 3,
                  borderRadius: 2,
                  marginRight: 2,
                  height: 6 + level * 20,
                  backgroundColor: played ? playedColor : idleColor,
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
