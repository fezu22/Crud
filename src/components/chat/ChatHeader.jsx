import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import PresenceIndicator from './PresenceIndicator';
import { PressableScale } from '../motion';

import {
  CHAT_ICON_BUTTON_SIZE,
  getChatIconButtonTokens,
} from './ChatIcons';

import { setZegoCallThemeMode } from './ZegoCallUi';

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

  if (!lastSeen || Number.isNaN(lastSeen.getTime())) {
    return null;
  }

  const elapsed = Math.max(0, Date.now() - lastSeen.getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) {
    return 'Last seen just now';
  }

  if (minutes < 60) {
    return `Last seen ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Last seen ${hours}h ago`;
  }

  if (hours < 48) {
    return 'Last seen yesterday';
  }

  return `Last seen ${lastSeen.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })}`;
}

export default function ChatHeader({
  theme,
  contact,
  currentUserId,
  themeMode = 'dark',
  onBack,
  zegoStatus = 'idle',
  onRetryZego,
  onStartCall,
}) {
  const online = Boolean(contact?.online);
  const onlinePresenceColor = '#22c55e';

  const contactId = contact?.id || contact?._id;

  const canInvite =
    zegoStatus === 'ready' &&
    Boolean(contactId) &&
    String(contactId) !== String(currentUserId);
  const canRetryCalls =
    zegoStatus === 'error' &&
    Boolean(contactId) &&
    String(contactId) !== String(currentUserId);

  const lastSeenText = formatLastSeen(
    contact?.lastSeenAt || contact?.lastActiveAt,
  );

  const [showLastSeen, setShowLastSeen] = useState(true);
  const statusOpacity = useRef(new Animated.Value(1)).current;

  const shouldCyclePresence =
    !online &&
    Boolean(lastSeenText) &&
    zegoStatus === 'ready';

  const actionTokens = getChatIconButtonTokens(theme);

  useEffect(() => {
    let active = true;

    statusOpacity.stopAnimation();
    statusOpacity.setValue(1);
    setShowLastSeen(true);

    if (!shouldCyclePresence) {
      return () => {
        active = false;
      };
    }

    const interval = setInterval(() => {
      Animated.timing(statusOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) {
          return;
        }

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

  const callStatusText =
    zegoStatus === 'error'
      ? 'Calls unavailable — tap a call button to retry'
      : zegoStatus === 'initializing'
        ? 'Connecting calls...'
        : presenceText;

  const startCall = type => {
    console.info('[ZEGOCLOUD][release-check]', {
      stage: 'chat header call button pressed',
      callType: type,
      zegoStatus,
      currentUserId: currentUserId ? String(currentUserId).slice(0, 80) : '',
      recipientId: contactId ? String(contactId).slice(0, 80) : '',
    });

    if (canRetryCalls) {
      onRetryZego?.();
      return;
    }

    if (!canInvite) {
      return;
    }

    setZegoCallThemeMode(themeMode);
    onStartCall?.(type);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.line,
        },
      ]}>

      <View style={styles.userSection}>

        <PressableScale
          onPress={onBack}
          hitSlop={12}
          accessibilityLabel="Back to messages"
          style={[
            styles.backAction,
            {
              backgroundColor:
                theme.surfaceAlt ||
                theme.surface ||
                'transparent',
            },
          ]}>

          <Text
            style={[
              styles.backChevron,
              {
                color:
                  theme.primaryLight ||
                  theme.primary ||
                  theme.ink,
              },
            ]}>
            ‹
          </Text>
        </PressableScale>

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.separatorBg,
              borderColor: theme.primary,
            },
          ]}>
          <Text
            style={[
              styles.avatarText,
              { color: theme.primaryLight },
            ]}>
            {initialsOf(contact?.name)}
          </Text>
        </View>

        <View style={styles.identity}>
          <Text
            style={[
              styles.name,
              { color: theme.ink },
            ]}
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
                {
                  color: online
                    ? onlinePresenceColor
                    : theme.muted,
                },
                {
                  opacity:
                    zegoStatus === 'ready'
                      ? statusOpacity
                      : 1,
                },
              ]}>
              {callStatusText}
            </Animated.Text>
          </View>
        </View>
      </View>

      <View style={styles.headerActions}>

        <TouchableOpacity
          disabled={!canInvite && !canRetryCalls}
          onPress={() => startCall('voice')}
          accessibilityLabel="Start voice call"
          activeOpacity={0.72}
          style={[
            styles.headerActionButton,
            {
              backgroundColor: actionTokens.backgroundColor,
              borderColor: actionTokens.borderColor,
            },
            !canInvite && !canRetryCalls && styles.unavailableAction,
          ]}>

          <Image
            source={require('../../assets/phone.png')}
            style={[
              styles.callIconImage,
              {
                tintColor: actionTokens.iconColor,
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!canInvite && !canRetryCalls}
          onPress={() => startCall('video')}
          accessibilityLabel="Start video call"
          activeOpacity={0.72}
          style={[
            styles.headerActionButton,
            {
              backgroundColor: actionTokens.backgroundColor,
              borderColor: actionTokens.borderColor,
            },
            !canInvite && !canRetryCalls && styles.unavailableAction,
          ]}>

          <Image
            source={require('../../assets/video.png')}
            style={[
              styles.callIconImage,
              {
                tintColor: actionTokens.iconColor,
              },
            ]}
            resizeMode="contain"
          />
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

  userSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginRight: 8,
  },

  backChevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: -2,
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
    width: CHAT_ICON_BUTTON_SIZE,
    height: CHAT_ICON_BUTTON_SIZE,
    borderRadius: CHAT_ICON_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  callIconImage: {
    width: 22,
    height: 22,
  },

  unavailableAction: {
    opacity: 0.45,
  },
});

