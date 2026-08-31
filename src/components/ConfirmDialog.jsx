import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

export default function ConfirmDialog({ config, onCancel }) {
  const confirm = () => {
    const action = config.onConfirm;
    onCancel();
    if (action) action();
  };
  return (
    <Modal
      transparent
      visible={config.visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm items-center rounded-[28px] bg-canvas p-6">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-amber-100">
            <Text className="text-3xl font-extrabold text-amber-600">!</Text>
          </View>
          <Text className="mt-5 text-center text-2xl font-extrabold text-ink">
            {config.title}
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            {config.message}
          </Text>
          <View className="mt-6 w-full flex-row">
            <TouchableOpacity
              className="mr-2 h-12 flex-1 items-center justify-center rounded-2xl bg-surface"
              onPress={onCancel}
            >
              <Text className="font-bold text-muted">{config.cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`ml-2 h-12 flex-1 items-center justify-center rounded-2xl ${
                config.isDestructive ? 'bg-red-500' : 'bg-brand'
              }`}
              onPress={confirm}
            >
              <Text className="font-extrabold text-white">
                {config.confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
