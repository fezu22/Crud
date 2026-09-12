import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ChatScreen from '../ChatScreen';

export default function AdminDashboardScreen({
  token,
  user,
  onError,
  onLogout,
  themeMode = 'dark',
  zegoStatus = 'idle',
  onRetryZego,
}) {
  const [conversationOpen, setConversationOpen] = useState(false);

  const dark = themeMode === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: dark ? '#12111a' : '#ffffff',
        },
      ]}>

      {!conversationOpen ? (
        <View
          style={[
            styles.adminHeader,
            {
              backgroundColor: dark ? '#12111a' : '#ffffff',
              borderBottomColor: dark ? '#2b2738' : '#e8e5ec',
            },
          ]}>

          <View style={styles.adminIdentity}>
            <Text
              style={[
                styles.adminLabel,
                { color: dark ? '#aaa3b5' : '#77717f' },
              ]}>
              Admin
            </Text>

            <Text
              style={[
                styles.adminName,
                { color: dark ? '#ffffff' : '#17131d' },
              ]}
              numberOfLines={1}>
              {user?.name || 'Admin'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onLogout}
            activeOpacity={0.75}
            accessibilityLabel="Log out"
            style={[
              styles.logoutButton,
              {
                backgroundColor: dark ? '#351f25' : '#fff0f1',
              },
            ]}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </View>
      ) : null}

      <View style={styles.chatContainer}>
        <ChatScreen
          token={token}
          user={user}
          themeMode={themeMode}
          zegoStatus={zegoStatus}
          onRetryZego={onRetryZego}
          onError={onError}
          onConversationStateChange={setConversationOpen}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  chatContainer: {
    flex: 1,
  },

  adminHeader: {
    minHeight: 64,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  adminIdentity: {
    flex: 1,
    paddingRight: 12,
  },

  adminLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  adminName: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '800',
  },

  logoutButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
});