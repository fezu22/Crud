import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export const MOTION = {
  softSpring: { damping: 20, stiffness: 180, mass: 1 },
};

export function PressableScale({ children, style, onPressIn, onPressOut, ...props }) {
  return (
    <Pressable
      {...props}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={state => [
        typeof style === 'function' ? style(state) : style,
        { transform: [{ scale: state.pressed ? 0.97 : 1 }] },
      ]}>
      {children}
    </Pressable>
  );
}

export function FadeSlideIn({ children, style, index = 0, distance = 12, from = 'bottom', ...props }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 220, delay: Math.min(index * 35, 250),
      useNativeDriver: true, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress]);
  return (
    <Animated.View {...props} style={[style, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({
        inputRange: [0, 1], outputRange: [from === 'top' ? -distance : distance, 0],
      }) }],
    }]}>{children}</Animated.View>
  );
}

export function ModalBackdrop({ visible, children, style, ...props }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, visible]);
  return <Animated.View {...props} style={[style, { opacity }]}>{children}</Animated.View>;
}

export function SkeletonBlock({ color, theme, style, ...props }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View {...props} style={[{ backgroundColor: color || theme?.surfaceAlt || '#64748b' }, style, { opacity }]} />;
}
