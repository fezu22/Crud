import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/appStyles';

export default function AnimatedImagePreview({ uri, onRemove }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      tension: 90,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.previewTile,
        {
          opacity: progress,
          transform: [
            { scale: progress },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
      <TouchableOpacity style={styles.previewRemoveBtn} onPress={onRemove}>
        <Text style={styles.previewRemoveText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
