import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
} from 'react-native';

/**
 * Shared centered modal shell.
 * Put only the modal's content inside this component.
 */
export default function CenteredModal({
  visible,
  onClose,
  children,
  cardClassName = '',
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-4 py-8"
          onPress={onClose}
        >
          <Pressable
            className={`max-h-[92%] w-full max-w-xl overflow-hidden rounded-[28px] border border-line bg-canvas ${cardClassName}`}
            onPress={() => {}}
          >
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
