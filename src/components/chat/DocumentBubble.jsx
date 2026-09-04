import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DocumentIcon } from './ChatIcons';

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
export default function DocumentBubble({ message, theme, mine }) {
  return (
    <View style={[styles.card, { backgroundColor: mine ? 'rgba(108, 77, 246, 0.35)' : theme.surfaceAlt }]}>
      <View style={[styles.iconSquare, { backgroundColor: theme.primary }]}>
        <DocumentIcon color="#FFFFFF" size={20} />
      </View>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: mine ? '#EAF7F2' : theme.ink }]} numberOfLines={2}>
          {message.fileName || 'Document'}
        </Text>
        <Text style={[styles.size, { color: mine ? 'rgba(234, 247, 242, 0.75)' : theme.muted }]}>
          {extensionOf(message)}
          {message.fileSize ? ` · ${formatFileSize(message.fileSize)}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    maxWidth: 232,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
  },
  size: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
