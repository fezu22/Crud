import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PresenceIndicator from './PresenceIndicator';
import { PressableScale } from '../motion';
import { PhoneIcon, VideoIcon } from './ChatIcons';

function initialsOf(name) {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatLastSeen(value) {
  const lastSeen = value ? new Date(value) : null;
  if (!lastSeen || Number.isNaN(lastSeen.getTime())) return null;

  const elapsed = Math.max(0, Date.now() - lastSeen.getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Last seen just now';
  if (minutes < 60) return `Last seen ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  if (hours < 48) return 'Last seen yesterday';
  return `Last seen ${lastSeen.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

/**
 * Chat header: back button, avatar, contact name with an animated presence
 * indicator, and the two call actions.
 */
export default function ChatHeader({
  theme,
  contact,
  currentUserId,
  onBack,
  zegoStatus = 'idle',
  onStartCall,
}) {
  const online = Boolean(contact?.online);
  const onlinePresenceColor = '#22c55e';
  const contactId = contact?.id || contact?._id;
  const canInvite =
    zegoStatus === 'ready' &&
    Boolean(contactId) &&
    String(contactId) !== String(currentUserId);
  const lastSeenText = formatLastSeen(contact?.lastSeenAt || contact?.lastActiveAt);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const statusOpacity = useRef(new Animated.Value(1)).current;
  const shouldCyclePresence = !online && Boolean(lastSeenText) && zegoStatus === 'ready';

  useEffect(() => {
    let active = true;
    statusOpacity.stopAnimation();
    statusOpacity.setValue(1);
    setShowLastSeen(true);
    if (!shouldCyclePresence) return () => { active = false; };

    const interval = setInterval(() => {
      Animated.timing(statusOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        setShowLastSeen(current => !current);
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      statusOpacity.stopAnimation();
    };
  }, [lastSeenText, shouldCyclePresence, statusOpacity]);

  const presenceText = online
    ? 'Online'
    : showLastSeen && lastSeenText
      ? lastSeenText
      : 'Offline';
  const callStatusText = zegoStatus === 'error'
    ? 'Calls unavailable — tap a call button to retry'
    : zegoStatus === 'initializing'
      ? 'Connecting call service…'
      : presenceText;
  const startCall = type => {
    if (canInvite) onStartCall?.(type);
  };

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.background, borderBottomColor: theme.line },
      ]}>
      <View style={styles.userSection}>
        <PressableScale
          onPress={onBack}
          hitSlop={10}
          accessibilityLabel="Back to messages"
          style={[styles.backAction, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}>
          <Text style={[styles.backGlyph, { color: theme.ink }]}>{'\u2039'}</Text>
        </PressableScale>

        <View style={[styles.avatar, { backgroundColor: theme.separatorBg, borderColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.primaryLight }]}>{initialsOf(contact?.name)}</Text>
        </View>

        <View style={styles.identity}>
          <Text
            style={[styles.name, { color: theme.ink }]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {contact?.name || 'Medi user'}
          </Text>
          <View style={styles.statusRow}>
            <PresenceIndicator
              online={online}
              size={8}
              onlineColor={onlinePresenceColor}
              offlineColor={theme.offlineDot}
            />
            <Animated.Text
              style={[
                styles.statusText,
                { color: online ? onlinePresenceColor : theme.muted },
                { opacity: zegoStatus === 'ready' ? statusOpacity : 1 },
              ]}>{callStatusText}</Animated.Text>
          </View>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          disabled={!canInvite}
          onPress={() => startCall('voice')}
          accessibilityLabel="Start voice call"
          style={[
            styles.headerActionButton,
            { backgroundColor: theme.separatorBg, borderColor: theme.line },
            !canInvite && styles.unavailableAction,
          ]}>
          <PhoneIcon color={theme.primaryLight} size={23} />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canInvite}
          onPress={() => startCall('video')}
          accessibilityLabel="Start video call"
          style={[
            styles.headerActionButton,
            { backgroundColor: theme.separatorBg, borderColor: theme.line },
            !canInvite && styles.unavailableAction,
          ]}>
          <VideoIcon color={theme.primaryLight} size={23} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 14,
  },
  userSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    height: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableAction: {
    opacity: 0.45,
  },
  backAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginRight: 10,
  },
  backGlyph: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    marginTop: -2,
  },
});
