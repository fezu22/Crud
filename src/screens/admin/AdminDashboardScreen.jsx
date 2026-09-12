import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ChatScreen from '../ChatScreen';

export default function AdminDashboardScreen({
  token,
  user,
  onLogout,
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

      <TouchableOpacity
        className="absolute right-20 top-7"
        onPress={onLogout}
        accessibilityLabel="Log out">
        <Text className="font-bold text-brand">Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
