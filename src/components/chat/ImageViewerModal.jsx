import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Full-screen viewer for chat images. Tapping the backdrop or the close
 * button dismisses it.
 */
export default function ImageViewerModal({ visible, image, theme, onClose }) {
  if (!image) return null;
  const source =
    typeof image.imageUrl === 'number' ? image.imageUrl : { uri: image.imageUrl };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.surface }]}
            onPress={onClose}
            accessibilityLabel="Close image viewer">
            <Text style={{ color: theme.ink, fontSize: 16, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </View>
        <Image source={source} style={styles.image} resizeMode="contain" />
        {image.caption ? (
          <View style={styles.captionRow}>
            <Text style={styles.caption}>{image.caption}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 10, 0.97)',
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  captionRow: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  caption: {
    color: '#D9E7E2',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
