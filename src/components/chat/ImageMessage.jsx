import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';

/**
 * Photo attachment inside a message bubble. Tapping opens the full-screen
 * viewer. Works with bundled asset numbers and remote/file URIs.
 */
export default function ImageMessage({ message, theme, onPress }) {
  const uri = message.imageUrl || message.attachmentUrl;
  const source =
    typeof uri === 'number' ? uri : { uri };
  const isVideo =
    message.type === 'video' ||
    message.fileType?.startsWith('video/');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.image, { backgroundColor: theme.surfaceAlt }]}>
      {isVideo ? (
        <Video
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          paused
          controls
        />
      ) : (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 232,
    height: 168,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
  },
});
