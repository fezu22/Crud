import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckIcon, DoubleCheckIcon } from './ChatIcons';

export function formatClock(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function StatusTicks({ status, theme, mine }) {
  if (!mine) return null;
  if (status === 'read') return <DoubleCheckIcon color={theme.readTick} size={13} />;
  if (status === 'delivered') return <DoubleCheckIcon color={theme.tick} size={13} />;
  return <CheckIcon color={theme.tick} size={12} />;
}

/**
 * A single chat message: outgoing bubbles sit right in purple, incoming
 * bubbles sit left in dark surfaces, both with clock time and delivery
 * ticks. `renderAttachment` plugs in image/document/voice content.
 */
export default function MessageBubble({ message, theme, mine, renderAttachment }) {
  const outgoing = mine;
  return (
    <View style={[styles.row, { justifyContent: outgoing ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          outgoing ? styles.bubbleOut : styles.bubbleIn,
          {
            backgroundColor: outgoing ? theme.outgoingBase : theme.incomingBubble,
          },
          outgoing ? null : { borderColor: theme.incomingBorder, borderWidth: 1 },
        ]}>
        {outgoing ? (
          <View style={[styles.tint, { backgroundColor: theme.outgoingTop }]} />
        ) : null}
        <View>
          {renderAttachment ? renderAttachment(message) : null}
          {message.text ? (
            <Text
              style={{
                color: outgoing ? '#F5F3FA' : theme.ink,
                fontSize: 15,
                lineHeight: 21,
              }}>
              {message.text}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text
              style={{
                color: outgoing ? 'rgba(245, 243, 250, 0.75)' : theme.muted,
                fontSize: 10,
                fontWeight: '600',
              }}>
              {formatClock(message.createdAt)}
            </Text>
            <StatusTicks status={message.status} theme={theme} mine={outgoing} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 3,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  bubbleOut: {
    borderBottomRightRadius: 6,
  },
  bubbleIn: {
    borderBottomLeftRadius: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
});
