import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DraggableSuccessModal({ visible, message, onClose }) {
  const position = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible) return;
    lastPosition.current = { x: 0, y: 0 };
    position.setValue({ x: 0, y: 0 });
    opacity.setValue(0);
    scale.setValue(0.86);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 13,
        stiffness: 150,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, position, scale, visible, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderMove: (_, gesture) => {
        position.setValue({
          x: lastPosition.current.x + gesture.dx,
          y: lastPosition.current.y + gesture.dy,
        });
      },
      onPanResponderRelease: (_, gesture) => {
        lastPosition.current = {
          x: lastPosition.current.x + gesture.dx,
          y: lastPosition.current.y + gesture.dy,
        };
      },
    }),
  ).current;

  if (!visible) return null;
  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              ...position.getTranslateTransform(),
              { scale },
            ],
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.checkCircle}>
            <Text style={styles.check}>{'\u2713'}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subtitle}>Keep going, you're doing great!</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    width: '82%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  dragArea: { alignItems: 'center', paddingBottom: 10 },
  checkCircle: {
    width: 78,
    height: 78,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#22C55E',
    borderRadius: 39,
  },
  check: { color: '#22C55E', fontSize: 45, fontWeight: '700' },
  message: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    paddingVertical: 13,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
