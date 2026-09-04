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
      <TouchableOpacity onPress={onBack} hitSlop={10}>
        <Text style={[styles.back, { color: theme.primary }]}>Back</Text>
      </TouchableOpacity>

      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.ink }]} numberOfLines={1}>
          {contact.name}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: theme.offlineDot }]} />
          <Text style={[styles.statusText, { color: theme.muted }]}>
            {contact.online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.action}
        onPress={onVoiceCall}
        hitSlop={8}
        accessibilityLabel="Voice call">
        <PhoneIcon color={theme.primaryLight} size={18} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.action}
        onPress={onVideoCall}
        hitSlop={8}
        accessibilityLabel="Video call">
        <VideoIcon color={theme.primaryLight} size={18} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
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
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
