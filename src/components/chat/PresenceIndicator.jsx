import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function PresenceIndicator({
  online = false,
  size = 8,
  theme,
  onlineColor,
  offlineColor,
  style,
}) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.setValue(1);
    if (!online) {
      return undefined;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 900, useNativeDriver: true, isInteraction: false }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true, isInteraction: false }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [online, opacity]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={online ? 'Online' : 'Offline'}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginRight: 6,
          opacity,
          backgroundColor: online
            ? onlineColor || theme?.onlineDot || '#22c55e'
            : offlineColor || theme?.offlineDot || '#94a3b8',
        },
        style,
      ]}
    />
  );
}
