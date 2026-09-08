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
    [image?.type, image?.messageType].some(type => String(type || '').toLowerCase() === 'video') ||
    String(image?.fileType || '').toLowerCase().startsWith('video/');
  const [resolvedUri, setResolvedUri] = useState(uri);
  const [loading, setLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let downloadJob;
    setResolvedUri(null);
    setPlaybackError('');

    if (!visible || !uri) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!/^https?:\/\//i.test(uri) || !token) {
      setResolvedUri(uri);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // Video can stream directly with the auth header. Avoid waiting for an
    // RNFS copy, which can leave the viewer stuck on its loading indicator.
    if (isVideo) {
      setResolvedUri(uri);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const extension = String(image?.fileType || (isVideo ? 'video/mp4' : 'image/jpeg'))
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
        } else if (!cancelled) {
          setPlaybackError(isVideo ? 'The video could not be loaded.' : 'The image could not be loaded.');
        }
        if (!cancelled) setLoading(false);
      })
      .catch(error => {
        if (!cancelled) {
          setPlaybackError(error?.message || (isVideo ? 'The video could not be loaded.' : 'The image could not be loaded.'));
          setLoading(false);
        }
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
      <View style={styles.backdrop}>
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
          <View style={styles.videoFrame}>
            {resolvedUri && !playbackError ? (
              <Video
                source={source}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
                paused={false}
                controls={false}
                fullscreen={false}
                onLoad={() => setLoading(false)}
                onError={error => {
                  setPlaybackError(error?.error?.errorString || 'The video could not be played.');
                  setLoading(false);
                }}
              />
            ) : null}
            {!loading && playbackError ? (
              <Text style={styles.errorText}>{playbackError}</Text>
            ) : null}
          </View>
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
      </View>
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
  videoFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
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
