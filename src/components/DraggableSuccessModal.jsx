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
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible) return;
    lastPosition.current = { x: 0, y: 0 };
    position.setValue({ x: 0, y: 0 });
  }, [position, visible]);

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
    <View pointerEvents={'box-none'} style={styles.overlay}>
      <Animated.View
        style={[styles.card, { transform: position.getTranslateTransform() }]}
      >
        <View {...panResponder.panHandlers} style={styles.dragArea}>

          <View style={styles.checkCircle}>
            <Text style={styles.check}>{'\u2713'}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    width: '82%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  dragArea: { alignItems: 'center', paddingBottom: 10 },
  dragLabel: { marginBottom: 15, color: '#9CA3AF', fontSize: 13 },
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
  button: {
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
