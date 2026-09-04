import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BackIcon, MoreIcon, PhoneIcon, ThemeIcon, VideoIcon } from './ChatIcons';

/**
 * Sticky chat header: avatar with presence dot, contact name and status,
 * voice/video call actions, theme toggle and a more-options button.
 */
export default function ChatHeader({
  theme,
  contact,
  onBack,
  onToggleTheme,
  onMore,
  onVoiceCall,
  onVideoCall,
}) {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.surface, borderBottomColor: theme.line },
      ]}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={8}>
        <BackIcon color={theme.ink} size={22} />
      </TouchableOpacity>

      <View style={styles.avatar}>
        <View style={[styles.avatarBase, { backgroundColor: theme.green }]} />
        <View style={[styles.avatarGlow, { backgroundColor: theme.greenLight }]} />
        <Text style={styles.avatarText}>
          {(contact.name || '?')
            .split(' ')
            .map(part => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </Text>
        {contact.online ? (
          <View style={[styles.presence, { borderColor: theme.surface }]} />
        ) : null}
      </View>

      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.ink }]} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text style={[styles.status, { color: theme.muted }]} numberOfLines={1}>
          {contact.online ? 'Online' : 'Offline'} · {contact.specialty || 'Available'}
        </Text>
      </View>

      <HeaderButton onPress={onVoiceCall} accessibilityLabel="Voice call">
        <PhoneIcon color={theme.greenLight} size={19} />
      </HeaderButton>
      <HeaderButton onPress={onVideoCall} accessibilityLabel="Video call">
        <VideoIcon color={theme.greenLight} size={19} />
      </HeaderButton>
      <HeaderButton onPress={onToggleTheme} accessibilityLabel="Toggle theme">
        <ThemeIcon dark={theme.mode === 'dark'} size={19} />
      </HeaderButton>
      <HeaderButton onPress={onMore} accessibilityLabel="More options">
        <MoreIcon color={theme.ink} size={19} />
      </HeaderButton>
    </View>
  );
}

function HeaderButton({ children, onPress, accessibilityLabel }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.action}
      hitSlop={6}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarBase: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarGlow: {
    position: 'absolute',
    top: -14,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.5,
  },
  avatarText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  presence: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  identity: {
    flex: 1,
    marginRight: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  status: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '600',
  },
  action: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
