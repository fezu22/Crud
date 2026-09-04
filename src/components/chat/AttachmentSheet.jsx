import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraIcon, DocumentIcon } from './ChatIcons';

function GalleryGlyph({ color }) {
  return (
    <View style={{ width: 20, height: 18 }}>
      <View style={[styles.galleryBody, { backgroundColor: color }]} />
      <View style={[styles.galleryDot, { backgroundColor: color }]} />
      <View style={[styles.gallerySun, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
    </View>
  );
}

/**
 * Bottom sheet with the three share sources: gallery, camera and documents.
 */
export default function AttachmentSheet({
  visible,
  theme,
  onClose,
  onGallery,
  onCamera,
  onDocument,
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
          <Text style={[styles.title, { color: theme.ink }]}>Share</Text>

          <OptionRow
            icon={<GalleryGlyph color={theme.primaryLight} />}
            title="Gallery"
            subtitle="Send a photo from your device"
            theme={theme}
            onPress={onGallery}
          />
          <OptionRow
            icon={<CameraIcon color={theme.primaryLight} size={19} />}
            title="Camera"
            subtitle="Take a new photo"
            theme={theme}
            onPress={onCamera}
          />
          <OptionRow
            icon={<DocumentIcon color={theme.primaryLight} size={20} />}
            title="Document"
            subtitle="Share a PDF or other file"
            theme={theme}
            onPress={onDocument}
          />

          <TouchableOpacity style={[styles.cancel, { borderColor: theme.line }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({ icon, title, subtitle, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.line }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surfaceAlt }]}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 22,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  cancel: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontWeight: '700',
  },
  galleryBody: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 20,
    height: 15,
    borderRadius: 3,
  },
  galleryDot: {
    position: 'absolute',
    top: 8,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  gallerySun: {
    position: 'absolute',
    top: 4,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
