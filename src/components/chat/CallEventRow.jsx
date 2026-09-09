import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PhoneIcon, VideoIcon } from './ChatIcons';
import { formatClock } from './MessageBubble';
import { FadeSlideIn } from '../motion';

export default function CallEventRow({ event, theme, index = 0 }) {
  const seconds = Math.max(0, Math.floor(Number(event.durationSeconds) || 0));
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const kind = event.callType === 'video' ? 'Video call' : 'Voice call';
  const status = event.connected
    ? `${event.outgoing ? 'Outgoing' : 'Incoming'} · ${duration}`
    : event.outgoing ? 'Not answered' : 'Missed call';
  const Icon = event.callType === 'video' ? VideoIcon : PhoneIcon;
  const color = event.connected ? theme.primary : theme.danger;

  return (
    <FadeSlideIn index={index} distance={8} style={styles.row}>
      <View style={[styles.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}>
        <Icon size={18} color={color} />
        <View style={styles.details}>
          <Text style={[styles.title, { color: theme.ink }]}>{kind}</Text>
          <Text style={[styles.subtitle, { color }]}>{status}</Text>
        </View>
        <Text style={[styles.time, { color: theme.muted }]}>{formatClock(event.createdAt)}</Text>
      </View>
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', marginVertical: 6, paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, maxWidth: '100%' },
  details: { marginHorizontal: 12, flexShrink: 1 },
  title: { fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 3 },
  time: { fontSize: 10 },
});
