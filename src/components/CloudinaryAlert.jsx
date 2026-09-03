import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import CenteredModal from './CenteredModal';

export default function CloudinaryAlert({ visible, onConfirm }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(35)).current;
  const [shown, setShown] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShown(true);
      opacity.setValue(0);
      translateY.setValue(35);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (shown) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 35, duration: 150, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setShown(false); });
    }
  }, [visible, shown, opacity, translateY]);

  function close() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 35, duration: 150, useNativeDriver: true }),
    ]).start(() => { setShown(false); onConfirm(); });
  }

  return <CenteredModal visible={shown} onClose={close}>
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
    <View className="w-full items-center rounded-3xl bg-canvas p-6 dark:bg-[#201e29]">
      <Text className="text-center text-2xl font-extrabold text-ink dark:text-white">The Cloudinary account?</Text>
      <Text className="mt-3 text-center text-sm leading-5 text-muted dark:text-[#aaa5b5]">You are not logged in to Cloudinary. Connect your Cloudinary account to continue.</Text>
      <TouchableOpacity className="mt-6 h-13 w-full items-center justify-center rounded-2xl bg-brand" onPress={close}>
        <Text className="font-extrabold text-white">OK</Text>
      </TouchableOpacity>
    </View>
    </Animated.View>
  </CenteredModal>;
}
