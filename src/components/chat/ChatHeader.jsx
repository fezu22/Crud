import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PhoneIcon, VideoIcon } from './ChatIcons';

/**
 * Chat header matched to the Faraz screen: purple Back text on the left,
 * bold contact name with a gray status dot and Offline label, voice and
 * video call icons on the right, thin divider underneath.
 */
export default function ChatHeader({ theme, contact, onBack, onVoiceCall, onVideoCall }) {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.background, borderBottomColor: theme.line },
      ]}>
      <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Back to messages" style={[styles.action, { backgroundColor: theme.surfaceAlt, marginRight: 12 }]}>
        <Text style={{ color: theme.ink, fontSize: 23 }}>{'<'}</Text>
      </TouchableOpacity>
      <View style={[styles.avatar, { backgroundColor: theme.separatorBg, borderColor: theme.primary }]}>
        <Text style={{ color: theme.primaryLight, fontWeight: '800' }}>{String(contact.name || 'U').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2)}</Text>
      </View>
      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.ink }]} numberOfLines={1}>
          {contact.name}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: contact.online ? theme.onlineDot : theme.offlineDot }]} />
          <Text style={[styles.statusText, { color: theme.muted }]}>
            {contact.online ? 'Active now' : 'Offline'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.action, { backgroundColor: theme.separatorBg, borderColor: theme.line, borderWidth: 1 }]}
        onPress={onVoiceCall}
        hitSlop={8}
        accessibilityLabel="Voice call">
        <PhoneIcon color={theme.primaryLight} size={18} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.action, { backgroundColor: theme.separatorBg, borderColor: theme.line, borderWidth: 1 }]}
        onPress={onVideoCall}
        hitSlop={8}
        accessibilityLabel="Video call">
        <VideoIcon color={theme.primaryLight} size={18} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  back: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 18,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  action: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
