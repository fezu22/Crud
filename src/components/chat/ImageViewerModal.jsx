import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';

/**
 * Full-screen viewer for chat images. Tapping the backdrop or the close
 * button dismisses it.
 */
export default function ImageViewerModal({ visible, image, theme, token, onClose }) {
  const uri = image?.imageUrl || image?.attachmentUrl || '';
  const isVideo =
    image?.type === 'video' ||
    image?.fileType?.startsWith('video/');
  const [resolvedUri, setResolvedUri] = useState(uri);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let downloadJob;
    setResolvedUri(uri);

    if (!visible || isVideo || !/^https?:\/\//i.test(uri) || !token) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const extension = String(image?.fileType || 'image/jpeg')
      .split('/')[1]
      .replace(/[^a-z0-9]/gi, '') || 'jpg';
    const filePath = `${RNFS.CachesDirectoryPath}/viewer-${String(image?._id || Date.now())}.${extension === 'jpeg' ? 'jpg' : extension}`;
    setLoading(true);
    downloadJob = RNFS.downloadFile({
      fromUrl: uri,
      toFile: filePath,
      headers: { Authorization: `Bearer ${token}` },
      background: false,
    });
    downloadJob.promise
      .then(async result => {
        const stat = await RNFS.stat(filePath).catch(() => null);
        if (!cancelled && result.statusCode >= 200 && result.statusCode < 300 && Number(stat?.size) > 0) {
          setResolvedUri(`file://${filePath}`);
        }
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      downloadJob?.stop?.();
    };
  }, [image?._id, image?.fileType, isVideo, token, uri, visible]);

  if (!image || !uri) return null;

  const source =
    typeof resolvedUri === 'number'
      ? resolvedUri
      : {
        uri: resolvedUri,
        headers: resolvedUri === uri && token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      };

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
        {loading ? <ActivityIndicator color={theme.primaryLight || theme.primary} style={styles.loader} /> : null}
        {isVideo ? (
          <Video
            source={source}
            style={styles.image}
            resizeMode="contain"
            controls
          />
        ) : (
          <Image
            source={source}
            style={styles.image}
            resizeMode="contain"
            onError={error => console.warn('[chat] viewer image failed to load', uri, error.nativeEvent?.error)}
          />
        )}
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
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 2,
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
