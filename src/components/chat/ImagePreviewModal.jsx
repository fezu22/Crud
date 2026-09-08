import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';

/**
 * Shown after picking a photo: preview with an optional caption before it
 * is added to the conversation.
 */
export default function ImagePreviewModal({ visible, image, theme, onCancel, onSend }) {
  const [caption, setCaption] = useState('');
  const [mediaReady, setMediaReady] = useState(false);
  const [dimensions, setDimensions] = useState(null);

  React.useEffect(() => {
    if (visible) setCaption('');
    if (visible) setMediaReady(false);
    if (visible) setDimensions(null);
  }, [visible]);

  if (!image) return null;
  const previewUri = image.previewUri || image.uri;
  const source = typeof previewUri === 'number' ? previewUri : { uri: previewUri };
  const isVideo = image.type?.startsWith('video/');
  const ratio = dimensions?.width && dimensions?.height
    ? dimensions.width / dimensions.height
    : 232 / 168;
  const previewWidth = Math.min(388, 300 * ratio);
  const previewHeight = Math.min(300, previewWidth / ratio);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={onCancel}
          />
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.ink }]}>
              {isVideo ? 'Send video' : 'Send photo'}
            </Text>
            <View
              style={[
                styles.previewWrap,
                {
                  width: isVideo ? '100%' : previewWidth,
                  height: isVideo ? 260 : previewHeight,
                },
              ]}>
              {!mediaReady ? (
                <View style={styles.previewLoading}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              ) : null}
              {isVideo ? (
                <Video
                  source={source}
                  style={styles.preview}
                  resizeMode="cover"
                  paused
                  controls
                  onLoad={() => setMediaReady(true)}
                  onError={() => setMediaReady(true)}
                />
              ) : (
                <Image
                  source={source}
                  style={[styles.preview, { width: previewWidth, height: previewHeight }]}
                  resizeMode="contain"
                  onLoad={({ nativeEvent }) => {
                    setDimensions(nativeEvent.source);
                    setMediaReady(true);
                  }}
                  onError={() => setMediaReady(true)}
                />
              )}
            </View>
            <TextInput
              style={[
                styles.captionInput,
                {
                  backgroundColor: theme.composerField,
                  borderColor: theme.line,
                  color: theme.ink,
                },
              ]}
              placeholder="Add a caption (optional)…"
              placeholderTextColor={theme.muted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={300}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.line }]}
                onPress={onCancel}>
                <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => onSend(caption.trim())}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#211F2B',
  },
  previewWrap: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#211F2B',
  },
  previewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  captionInput: {
    marginTop: 12,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelText: {
    fontWeight: '700',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
