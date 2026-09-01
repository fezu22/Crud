import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import CenteredModal from './CenteredModal';

export default function ConfirmDialog({ config, onCancel }) {
  function confirm() {
    const action = config.onConfirm;
    onCancel();
    if (action) action();
  }

  return (
    <CenteredModal visible={config.visible} onClose={onCancel}>
      <View className="items-center bg-canvas p-6">
        <View className={`h-16 w-16 items-center justify-center rounded-3xl ${config.isDestructive ? 'bg-red-100 dark:bg-[#3b2027]' : 'bg-[#ede9fe] dark:bg-[#2c2840]'}`}>
          <Text className={`text-3xl font-extrabold ${config.isDestructive ? 'text-red-500' : 'text-brand'}`}>!</Text>
        </View>
        <Text className="mt-5 text-center text-2xl font-extrabold text-ink">{config.title}</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-muted">{config.message}</Text>
        <View className="mt-6 w-full flex-row">
          <TouchableOpacity className="mr-2 h-12 flex-1 items-center justify-center rounded-2xl bg-surface" onPress={onCancel}>
            <Text className="font-bold text-muted">{config.cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`ml-2 h-12 flex-1 items-center justify-center rounded-2xl ${config.isDestructive ? 'bg-red-500' : 'bg-brand'}`}
            onPress={confirm}
          >
            <Text className="font-extrabold text-white">{config.confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </CenteredModal>
  );
}
