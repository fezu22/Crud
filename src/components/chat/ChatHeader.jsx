import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PresenceIndicator from './PresenceIndicator';
import { PressableScale } from '../motion';
import { ZegoSendCallInvitationButton } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { getZegoUserId, getZegoUserName } from '../../services/zegoService';

function initialsOf(name) {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Chat header: back button, avatar, contact name with an animated presence
 * indicator, and the two call actions.
 */
export default function ChatHeader({ theme, contact, onBack }) {
  const online = Boolean(contact?.online);
  const invitee = contact?.id || contact?._id
    ? [{ userID: getZegoUserId(contact), userName: getZegoUserName(contact) }]
    : [];
  const lastSeen = contact?.lastSeenAt ? new Date(contact.lastSeenAt) : null;
  const lastSeenText = online
    ? 'Online'
    : lastSeen && !Number.isNaN(lastSeen.getTime())
      ? `Last seen ${lastSeen.toLocaleDateString() === new Date().toLocaleDateString() ? `today at ${lastSeen.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : lastSeen.toLocaleDateString([], { day: 'numeric', month: 'short' })}`
      : 'Offline';

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.background, borderBottomColor: theme.line },
      ]}>
      <PressableScale
        onPress={onBack}
        hitSlop={10}
        accessibilityLabel="Back to messages"
        style={[styles.action, styles.backAction, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}>
        <Text style={[styles.backGlyph, { color: theme.ink }]}>{'\u2039'}</Text>
      </PressableScale>

      <View style={[styles.avatar, { backgroundColor: theme.separatorBg, borderColor: theme.primary }]}>
        <Text style={[styles.avatarText, { color: theme.primaryLight }]}>{initialsOf(contact?.name)}</Text>
      </View>

      <View style={styles.identity}>
        <Text style={[styles.name, { color: theme.ink }]} numberOfLines={1}>
          {contact?.name || 'Medi user'}
        </Text>
        <View style={styles.statusRow}>
          <PresenceIndicator
            online={online}
            size={8}
            onlineColor={theme.onlineDot}
            offlineColor={theme.offlineDot}
          />
          <Text
            style={[
              styles.statusText,
              { color: online ? theme.onlineDot : theme.muted },
            ]}>{lastSeenText}</Text>
        </View>
      </View>

      <ZegoSendCallInvitationButton
        invitees={invitee}
        isVideoCall={false}
        text="☎"
        textColor={theme.primaryLight}
        fontSize={18}
        width={38}
        height={38}
        backgroundColor={theme.separatorBg}
        borderColor={theme.line}
        borderWidth={1}
        borderRadius={12}
        callName={contact?.name || 'Medi user'}
      />
      <ZegoSendCallInvitationButton
        invitees={invitee}
        isVideoCall
        text="▣"
        textColor={theme.primaryLight}
        fontSize={18}
        width={38}
        height={38}
        backgroundColor={theme.separatorBg}
        borderColor={theme.line}
        borderWidth={1}
        borderRadius={12}
        callName={contact?.name || 'Medi user'}
      />
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
  action: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  backAction: {
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
