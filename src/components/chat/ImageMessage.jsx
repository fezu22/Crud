import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity } from 'react-native';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';

/**
 * Photo attachment inside a message bubble. Tapping opens the full-screen
 * viewer. Works with bundled asset numbers and remote/file URIs.
 */
export default function ImageMessage({ message, theme, token, onPress }) {
  const uri = message.imageUrl || message.attachmentUrl;
  const isVideo =
    message.type === 'video' ||
    message.fileType?.startsWith('video/');
  const hasStoredDimensions = Boolean(message.mediaWidth && message.mediaHeight);
  const [resolvedUri, setResolvedUri] = useState(isVideo || typeof uri === 'number' ? uri : null);
  const [dimensions, setDimensions] = useState(
    message.mediaWidth && message.mediaHeight
      ? { width: message.mediaWidth, height: message.mediaHeight }
      : null,
  );

  useEffect(() => {
    let cancelled = false;
    let downloadJob;

    if (!message.mediaWidth || !message.mediaHeight) setDimensions(null);

    if (isVideo || typeof uri === 'number') {
      setResolvedUri(uri);
      return () => {
        cancelled = true;
      };
    }

    setResolvedUri(null);

    const resolveDimensions = candidateUri => {
      Image.getSize(
        candidateUri,
        (width, height) => {
          if (!cancelled) {
            if (hasStoredDimensions) setDimensions({ width, height });
            setResolvedUri(candidateUri);
          }
        },
        () => {
          if (!cancelled) setResolvedUri(candidateUri);
        },
      );
    };

    if (!/^https?:\/\//i.test(uri) || !token) {
      resolveDimensions(uri);
      return () => {
        cancelled = true;
      };
    }

    const extension = String(message.fileType || 'image/jpeg')
      .split('/')[1]
      .replace(/[^a-z0-9]/gi, '') || 'jpg';
    const filePath = `${RNFS.CachesDirectoryPath}/chat-${String(message._id || Date.now())}.${extension === 'jpeg' ? 'jpg' : extension}`;

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
          resolveDimensions(`file://${filePath}`);
        } else if (!cancelled) {
          resolveDimensions(uri);
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.warn('[chat] attachment fetch failed', error?.message);
          resolveDimensions(uri);
        }
      });

    return () => {
      cancelled = true;
      downloadJob?.stop?.();
    };
  }, [hasStoredDimensions, isVideo, message._id, message.fileType, message.mediaHeight, message.mediaWidth, token, uri]);

  if (!uri) return null;

  const ratio = dimensions?.width && dimensions?.height
    ? dimensions.width / dimensions.height
    : 232 / 168;
  const imageWidth = Math.min(232, 280 * ratio);
  const imageHeight = Math.min(280, imageWidth / ratio);

  if (!resolvedUri) {
    const loadingHeight = dimensions || hasStoredDimensions ? imageHeight : 168;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.image,
          styles.loadingImage,
          {
            backgroundColor: theme.surfaceAlt,
            width: isVideo ? 232 : imageWidth,
            height: isVideo ? 168 : loadingHeight,
          },
        ]}>
        <ActivityIndicator color={theme.primary} />
      </TouchableOpacity>
    );
  }

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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.image,
        {
          backgroundColor: theme.surfaceAlt,
          width: isVideo ? 232 : imageWidth,
          height: isVideo ? 168 : imageHeight,
        },
      ]}>
      {isVideo ? (
        <Video
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          paused
          controls
        />
      ) : (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={({ nativeEvent }) => setDimensions(nativeEvent.source)}
          onError={error => console.warn('[chat] image failed to load', uri, error.nativeEvent?.error)}
        />
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
  loadingImage: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
