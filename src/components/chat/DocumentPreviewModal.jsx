import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DocumentIcon } from './ChatIcons';
import Video from 'react-native-video';
import Pdf from 'react-native-pdf';

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileType(document) {
  const type = String(document?.type || '').split('/').pop();
  if (type && type !== 'octet-stream') return type.toUpperCase();

  const name = String(document?.name || document?.fileName || '');
  const extension = name.lastIndexOf('.') >= 0
    ? name.slice(name.lastIndexOf('.') + 1)
    : 'FILE';
  return extension.toUpperCase();
}

function fileExtension(document) {
  const name = String(document?.name || document?.fileName || '').toLowerCase();
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
}

function formatAudioDuration(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export default function DocumentPreviewModal({
  visible,
  document,
  theme,
  token,
  readOnly = false,
  onCancel,
  onSend,
  onDurationChange,
}) {
  const [previewUri, setPreviewUri] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [audioDuration, setAudioDuration] = useState(Number(document?.duration) || 0);

  const extension = fileExtension(document);
  const isPdf = (
    document?.type === 'application/pdf' ||
    document?.fileType === 'application/pdf' ||
    extension === 'pdf'
  );
  const isAudio = (
    String(document?.type || '').toLowerCase().startsWith('audio/') ||
    String(document?.fileType || '').toLowerCase().startsWith('audio/') ||
    ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(extension)
  );

  useEffect(() => {
    setAudioDuration(Number(document?.duration) || 0);
  }, [document?._id, document?.duration]);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      if (!visible || !document?.uri || !isPdf) {
        setPreviewUri(null);
        setPreviewError('');
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);
      setPreviewError('');

      try {
        let documentUri = document.uri;
        if (/^https?:\/\//i.test(documentUri)) {
          const fileSystemModule = require('react-native-fs');
          const fileSystem = fileSystemModule?.default || fileSystemModule;
          const destination = `${fileSystem.CachesDirectoryPath}/chat-preview-${String(document._id || Date.now())}.pdf`;
          const download = await fileSystem.downloadFile({
            fromUrl: documentUri,
            toFile: destination,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }).promise;

          if (download.statusCode < 200 || download.statusCode >= 300) {
            throw new Error('The document could not be downloaded for review.');
          }

          documentUri = `file://${destination}`;
        }

        if (active) setPreviewUri(documentUri);
      } catch (error) {
        if (active) setPreviewError(error?.message || 'The document could not be loaded.');
      } finally {
        if (active) setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => {
      active = false;
    };
  }, [document, isPdf, token, visible]);

  if (!document) return null;

  const openDocument = async () => {
    try {
      if (!document.uri) {
        throw new Error('This file does not have a valid location.');
      }

      // Load the native viewer only when needed so the JS test environment
      // does not have to transform the library's native entry file.
      let documentUri = document.uri;

      // Received documents are protected API URLs. Download them to cache so
      // Android's native viewer can open a local file with the right suffix.
      if (/^https?:\/\//i.test(documentUri)) {
        const fileViewerModule = require('react-native-fs');
        const fileSystem = fileViewerModule?.default || fileViewerModule;
        const extension = String(document.name || 'file')
          .split('.')
          .pop()
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase() || 'bin';
        const destination = `${fileSystem.CachesDirectoryPath}/chat-review-${String(document._id || Date.now())}.${extension}`;
        const download = await fileSystem.downloadFile({
          fromUrl: documentUri,
          toFile: destination,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).promise;

        if (download.statusCode < 200 || download.statusCode >= 300) {
          throw new Error('The document could not be downloaded for review.');
        }

        documentUri = `file://${destination}`;
      }

      const fileViewerModule = require('react-native-file-viewer');
      const fileViewer = fileViewerModule?.default || fileViewerModule;

      if (typeof fileViewer?.open === 'function') {
        await fileViewer.open(documentUri, { showOpenWithDialog: true });
        return;
      }

      // Some builds return a null native module until the app is rebuilt.
      // Let Android/iOS try the file with an installed compatible app.
      const canOpen = await Linking.canOpenURL(documentUri).catch(() => false);
      if (!canOpen) {
        throw new Error('No document viewer is available on this device.');
      }

      await Linking.openURL(documentUri);
    } catch (error) {
      Alert.alert('Cannot preview file', error?.message || 'The file could not be opened.');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.ink }]}>
            {readOnly ? 'Review document' : 'Review file'}
          </Text>
          {!readOnly ? (
            <View style={[styles.fileCard, { backgroundColor: theme.surfaceAlt }]}>
              <View style={[styles.icon, { backgroundColor: theme.primary }]}>
                <DocumentIcon color="#FFFFFF" size={24} />
              </View>
              <View style={styles.details}>
                <Text style={[styles.name, { color: theme.ink }]} numberOfLines={3}>
                  {document.name || document.fileName || 'Document'}
                </Text>
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {fileType(document)}
                  {document.size ? ` - ${formatFileSize(document.size)}` : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {readOnly && isPdf ? (
            <View style={[styles.viewer, { backgroundColor: theme.surfaceAlt }]}>
              {previewLoading ? <ActivityIndicator color={theme.primary} size="large" /> : null}
              {!previewLoading && previewUri && Pdf ? (
                <Pdf
                  source={{ uri: previewUri, cache: true }}
                  style={styles.pdf}
                  onError={(error) => setPreviewError(error?.message || 'The PDF could not be displayed.')}
                />
              ) : null}
              {!previewLoading && previewError ? (
                <Text style={[styles.errorText, { color: theme.muted }]}>{previewError}</Text>
              ) : null}
              {!previewLoading && !previewError && !Pdf ? (
                <Text style={[styles.errorText, { color: theme.muted }]}>
                  PDF preview is not available in this build.
                </Text>
              ) : null}
            </View>
          ) : null}

          {isAudio && document.uri ? (
            <Video
              source={{ uri: document.uri }}
              paused={false}
              muted
              volume={0}
              style={styles.audioMetadataLoader}
              onLoad={({ duration }) => {
                const seconds = Number(duration);
                if (Number.isFinite(seconds) && seconds > 0) {
                  setAudioDuration(seconds);
                  onDurationChange?.(seconds);
                }
              }}
              onError={() => {}}
            />
          ) : null}

          {isAudio && !readOnly ? (
            <Text style={[styles.audioDuration, { color: theme.muted }]}>
              {audioDuration > 0
                ? `Audio length: ${formatAudioDuration(audioDuration)}`
                : 'Reading audio length...'}
            </Text>
          ) : null}

          {readOnly && !isPdf ? (
            <View>
              <View style={[styles.fileCard, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.icon, { backgroundColor: theme.primary }]}>
                  <DocumentIcon color="#FFFFFF" size={24} />
                </View>
                <View style={styles.details}>
                  <Text style={[styles.name, { color: theme.ink }]} numberOfLines={3}>
                    {document.name || document.fileName || 'Document'}
                  </Text>
                  <Text style={[styles.meta, { color: theme.muted }]}>
                    {fileType(document)}
                    {document.size ? ` - ${formatFileSize(document.size)}` : ''}
                  </Text>
                </View>
              </View>
              <Text style={[styles.unsupportedText, { color: theme.muted }]}>This file type cannot be previewed inside the app yet.</Text>
            </View>
          ) : null}

          {(!readOnly || (isPdf && previewError)) ? (
            <TouchableOpacity
              style={[styles.previewButton, { borderColor: theme.primary }]}
              onPress={openDocument}>
              <Text style={[styles.previewText, { color: theme.primary }]}>
                {readOnly ? 'Open with another app' : 'Open file to review'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: theme.line }]}
              onPress={onCancel}>
              <Text style={[styles.cancelText, { color: theme.muted }]}>Close</Text>
            </TouchableOpacity>
            {!readOnly ? (
              <TouchableOpacity
                disabled={isAudio && audioDuration <= 0}
                style={[styles.button, { backgroundColor: theme.primary, opacity: isAudio && audioDuration <= 0 ? 0.45 : 1 }]}
                onPress={() => onSend?.(audioDuration)}>
                <Text style={styles.sendText}>Send file</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
  },
  viewer: {
    height: 430,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
  audioMetadataLoader: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    textAlign: 'center',
    paddingHorizontal: 22,
    lineHeight: 20,
  },
  unsupportedText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  previewButton: {
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 14,
  },
  previewText: {
    fontWeight: '800',
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
    paddingHorizontal: 20,
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
