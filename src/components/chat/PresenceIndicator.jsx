import React from 'react';
import { View } from 'react-native';

export default function PresenceIndicator({
  online = false,
  size = 8,
  theme,
  onlineColor,
  offlineColor,
  style,
}) {
  return (
    <View
      accessible
      accessibilityLabel={online ? 'Online' : 'Offline'}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginRight: 6,
          backgroundColor: online
            ? onlineColor || theme?.onlineDot || '#22c55e'
            : offlineColor || theme?.offlineDot || '#94a3b8',
        },
        style,
      ]}
    />
  );
}
