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

function Timestamp({ message, theme, mine, light }) {
  return (
    <View style={styles.metaRow}>
      <Text
        style={{
          color: light ? 'rgba(230, 242, 238, 0.75)' : theme.muted,
          fontSize: 10,
          fontWeight: '600',
        }}>
        {formatClock(message.createdAt)}
      </Text>
      <StatusTicks status={message.status} theme={theme} mine={mine} />
    </View>
  );
}

/**
 * A single chat message. Stage 1 renders text messages; image, document and
 * voice renderers are attached by their own components in later stages via
 * `renderAttachment`.
 */
export default function MessageBubble({ message, theme, mine, renderAttachment }) {
  const outgoing = mine;
  return (
    <View
      style={[
        styles.row,
        { justifyContent: outgoing ? 'flex-end' : 'flex-start' },
      ]}>
      {outgoing ? null : <AvatarDot theme={theme} />}
      <View
        style={[
          styles.bubble,
          outgoing ? styles.bubbleOut : styles.bubbleIn,
          {
            backgroundColor: outgoing
              ? theme.outgoingBase
              : theme.incomingBubble,
          },
          outgoing ? null : { borderColor: theme.incomingBorder, borderWidth: 1 },
        ]}>
        {outgoing ? (
          <View style={[styles.gradientTop, { backgroundColor: theme.outgoingMid }]} />
        ) : null}
        {outgoing ? (
          <View style={[styles.gradientGlow, { backgroundColor: theme.outgoingTop }]} />
        ) : null}
        <View>
          {renderAttachment ? renderAttachment(message) : null}
          {message.text ? (
            <Text
              style={{
                color: outgoing ? '#EAF7F2' : theme.ink,
                fontSize: 15,
                lineHeight: 21,
              }}>
              {message.text}
            </Text>
          ) : null}
          <Timestamp message={message} theme={theme} mine={outgoing} light={outgoing} />
        </View>
      </View>
    </View>
  );
}

function AvatarDot({ theme }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        alignSelf: 'flex-end',
        marginBottom: 4,
      }}>
      <Text style={{ color: theme.greenLight, fontSize: 11, fontWeight: '800' }}>D</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 3,
  },
  bubble: {
    maxWidth: '82%',
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
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  gradientGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.16,
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
