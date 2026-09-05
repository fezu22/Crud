import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import CenteredModal from './CenteredModal';

export default function CloudinaryAlert({ visible, onConfirm, onCancel }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const [shown, setShown] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShown(true);
      opacity.setValue(0);
      translateY.setValue(28);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 18,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    if (shown) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 28, duration: 160, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setShown(false);
      });
    }
    return undefined;
  }, [visible, shown, opacity, translateY]);

  function finish(action) {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 28, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setShown(false);
      action?.();
    });
  }

  return (
    <CenteredModal visible={shown} onClose={() => finish(onCancel)}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <View className="overflow-hidden rounded-[28px] bg-canvas dark:bg-[#201e29]">
          <View className="relative overflow-hidden bg-[#EEE9FF] px-6 pb-6 pt-7 dark:bg-[#302849]">
            <View className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#DCD1FF] dark:bg-[#443766]" />
            <View className="absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-[#E2D9FF] dark:bg-[#3A3157]" />
            <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-brand shadow-lg">
              <Text className="text-4xl">☁</Text>
            </View>
            <Text className="mt-5 text-2xl font-black text-[#211A39] dark:text-white">
              Connect your cloud
            </Text>
            <Text className="mt-2 text-sm leading-5 text-[#675F7A] dark:text-[#D0C8E2]">
              Add your Cloudinary details once to save task photos safely and access them from every device.
            </Text>
          </View>

          <View className="px-6 pb-6 pt-5">
            <View className="mb-5 flex-row items-center rounded-2xl bg-surface px-4 py-3 dark:bg-[#2A2734]">
              <Text className="mr-3 text-xl text-brand">✓</Text>
              <Text className="flex-1 text-xs leading-5 text-muted dark:text-[#B4AEC1]">
                Free Cloudinary storage works with this app. Your task will remain open while you connect it.
              </Text>
            </View>
            <TouchableOpacity
              className="h-14 items-center justify-center rounded-2xl bg-brand"
              onPress={() => finish(onConfirm)}
              accessibilityRole="button"
              accessibilityLabel="Connect cloud storage"
            >
              <Text className="text-base font-black text-white">Connect cloud storage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4 h-12 items-center justify-center rounded-2xl"
              onPress={() => finish(onCancel)}
              accessibilityRole="button"
              accessibilityLabel="Not now"
            >
              <Text className="font-extrabold text-muted dark:text-[#B4AEC1]">Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </CenteredModal>
  );
}

