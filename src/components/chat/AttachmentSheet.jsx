import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getChatIconButtonTokens } from './ChatIcons';

/**
 * Bottom sheet with the three share sources:
 * gallery, camera and documents.
 */
export default function AttachmentSheet({
  visible,
  theme,
  onClose,
  onGallery,
  onCamera,
  onDocument,
}) {
  const actionTokens = getChatIconButtonTokens(theme);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface },
          ]}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.line },
            ]}
          />

          <Text
            style={[
              styles.title,
              { color: theme.ink },
            ]}>
            Share something
          </Text>

          <View style={styles.grid}>
            <OptionRow
              iconSource={require('../../assets/image.png')}
              title="Gallery"
              theme={theme}
              tokens={actionTokens}
              onPress={onGallery}
            />

            <OptionRow
              iconSource={require('../../assets/camera.png')}
              title="Camera"
              theme={theme}
              tokens={actionTokens}
              onPress={onCamera}
            />

            <OptionRow
              iconSource={require('../../assets/google-docs.png')}
              title="Document"
              theme={theme}
              tokens={actionTokens}
              onPress={onDocument}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.cancel,
              { borderColor: theme.line },
            ]}
            onPress={onClose}>
            <Text
              style={[
                styles.cancelText,
                { color: theme.muted },
              ]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  iconSource,
  title,
  theme,
  tokens,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: theme.line },
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: tokens.backgroundColor,
            borderColor: tokens.borderColor,
          },
        ]}>
        <Image
          source={iconSource}
          style={styles.iconImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            { color: theme.ink },
          ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
  },

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
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  iconImage: {
    width: 24,
    height: 24,
  },

  rowText: {
    alignItems: 'center',
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
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
});
