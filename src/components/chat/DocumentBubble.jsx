import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(message) {
  const fromType = (message.fileType || '').split('/').pop();
  if (fromType && fromType.length <= 4) return fromType.toUpperCase();
  const name = message.fileName || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
}

/**
 * Document/PDF attachment inside a message bubble: file card with name,
 * size and type tag.
 */
export default function DocumentBubble({ message, theme, mine, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.card, { backgroundColor: mine ? theme.outgoingBase : theme.surfaceAlt }]}>
      <View style={styles.iconSquare}>
        <View
          style={[
            styles.fileGlyph,
            {
              backgroundColor: mine ? '#FFFFFF' : theme.primary,
            },
          ]}>
          <View
            style={[
              styles.fileFold,
              {
                borderTopColor: mine ? theme.outgoingBase : theme.surfaceAlt,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.meta}>
        <Text
          style={[styles.name, { color: mine ? '#FFFFFF' : theme.ink }]}
          numberOfLines={2}
          ellipsizeMode="tail">
          {message.fileName || 'Document'}
        </Text>
        <Text style={[styles.size, { color: mine ? 'rgba(255, 255, 255, 0.78)' : theme.muted }]}>
          {extensionOf(message)}
          {message.fileSize ? ` · ${formatFileSize(message.fileSize)}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 232,
    maxWidth: '100%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  iconSquare: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileGlyph: {
    width: 28,
    height: 34,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fileFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  size: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
