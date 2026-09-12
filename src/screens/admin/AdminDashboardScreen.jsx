import React from 'react';
import { View } from 'react-native';
import ChatScreen from '../ChatScreen';

export default function AdminDashboardScreen({
  token,
  user,
  onError,
  themeMode = 'dark',
  zegoStatus = 'idle',
  onRetryZego,
}) {
  return (
    <View className="flex-1">
      <ChatScreen
        token={token}
        user={user}
        themeMode={themeMode}
        zegoStatus={zegoStatus}
        onRetryZego={onRetryZego}
        onError={onError}
      />
    </View>
  );
}
