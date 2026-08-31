import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
export default function ModalHeader({ title, onClose, onEdit }) {
  return (
    <View className="h-[72px] flex-row items-center justify-between border-b border-line px-5">
      <TouchableOpacity
        className="h-11 w-11 items-center justify-center rounded-2xl bg-[#f0edfa]"
        onPress={onClose}
      >
        <Text className="text-2xl text-ink">‹</Text>
      </TouchableOpacity>
      <Text className="text-lg font-extrabold text-ink">{title}</Text>
      {onEdit ? (
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-2xl bg-[#f0edfa]"
          onPress={onEdit}
        >
          <Text className="text-xl text-ink">✎</Text>
        </TouchableOpacity>
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
}
