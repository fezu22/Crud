import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function ModalHeader({
  title,
  onClose,
  onEdit,
  onBack,
  actionLabel,
  onAction,
  actionDisabled = false,
}) {
  return (
    <View className="h-[72px] flex-row items-center border-b border-line bg-canvas px-5">
      {onBack ? (
        <TouchableOpacity
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center rounded-2xl bg-surface"
          onPress={onBack}
        >
          <Text className="text-2xl font-bold text-ink">←</Text>
        </TouchableOpacity>
      ) : (
        <View className="w-11" />
      )}
      <Text className="flex-1 text-center text-lg font-extrabold text-ink">{title}</Text>
      {onAction ? (
        <TouchableOpacity
          accessibilityLabel={actionLabel}
          className={`h-11 min-w-11 items-center justify-center rounded-2xl bg-brand px-3 ${actionDisabled ? 'opacity-40' : ''}`}
          disabled={actionDisabled}
          onPress={onAction}
        >
          <Text className="text-xs font-extrabold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          accessibilityLabel={onEdit ? 'Edit' : 'Close'}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-surface"
          onPress={onEdit || onClose}
        >
          <Text className="text-xl font-bold text-ink">{onEdit ? '✎' : '×'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
