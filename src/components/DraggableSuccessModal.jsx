import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';

export default function DraggableSuccessModal({
  visible,
  message,
  onClose,
}) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const position = useRef(
    new Animated.ValueXY({
      x: 0,
      y: 0,
    }),
  ).current;

  const opacity = useRef(
    new Animated.Value(0),
  ).current;

  const scale = useRef(
    new Animated.Value(0.82),
  ).current;

  const translateY = useRef(
    new Animated.Value(25),
  ).current;

  const lastPosition = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!visible) return;

    // Reset drag position every time alert opens
    lastPosition.current = {
      x: 0,
      y: 0,
    };

    position.setValue({
      x: 0,
      y: 0,
    });

    // Reset animation
    opacity.setValue(0);
    scale.setValue(0.82);
    translateY.setValue(25);

    // Open animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: true,
      }),

      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    visible,
    opacity,
    position,
    scale,
    translateY,
  ]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 ||
        Math.abs(gesture.dy) > 3,

      onPanResponderMove: (_, gesture) => {
        position.setValue({
          x:
            lastPosition.current.x +
            gesture.dx,

          y:
            lastPosition.current.y +
            gesture.dy,
        });
      },

      onPanResponderRelease: (_, gesture) => {
        lastPosition.current = {
          x:
            lastPosition.current.x +
            gesture.dx,

          y:
            lastPosition.current.y +
            gesture.dy,
        };
      },
    }),
  ).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: 15,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) {
        onClose();
      }
    });
  }

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          dark && darkStyles.card,
          {
            transform: [
              ...position.getTranslateTransform(),

              {
                translateY,
              },

              {
                scale,
              },
            ],
          },
        ]}
      >
        {/* DRAG HANDLE */}
        <View
          {...panResponder.panHandlers}
          style={styles.dragArea}
        >
          <View style={[styles.dragHandle, dark && darkStyles.dragHandle]} />
        </View>

        {/* SUCCESS ICON */}
        <View style={styles.iconOuter}>
          <View style={styles.iconMiddle}>
            <View style={styles.iconCircle}>
              <Text style={styles.check}>
                ✓
              </Text>
            </View>
          </View>
        </View>

        {/* SMALL LABEL */}
        <Text style={styles.successLabel}>
          SUCCESS
        </Text>

        {/* MAIN MESSAGE */}
        <Text style={[styles.message, dark && darkStyles.message]}>
          {message}
        </Text>

        {/* SUBTITLE */}
        <Text style={[styles.subtitle, dark && darkStyles.subtitle]}>
          Keep going, you're doing great!
        </Text>

        {/* DIVIDER */}
        <View style={[styles.divider, dark && darkStyles.divider]} />

        {/* BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleClose}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
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

    backgroundColor:
      'rgba(10, 8, 20, 0.62)',

    paddingHorizontal: 20,

    zIndex: 9999,
    elevation: 9999,
  },

  card: {
    width: '100%',
    maxWidth: 355,

    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 22,

    alignItems: 'center',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 14,
    },

    shadowOpacity: 0.22,
    shadowRadius: 25,

    elevation: 24,
  },

  dragArea: {
    width: '100%',
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',
  },

  dragHandle: {
    width: 42,
    height: 5,

    borderRadius: 50,

    backgroundColor: '#E5E7EB',
  },

  iconOuter: {
    width: 108,
    height: 108,

    borderRadius: 54,

    backgroundColor: '#F0FDF4',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,
    marginBottom: 18,
  },

  iconMiddle: {
    width: 88,
    height: 88,

    borderRadius: 44,

    backgroundColor: '#DCFCE7',

    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: '#22C55E',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#22C55E',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.28,
    shadowRadius: 12,

    elevation: 8,
  },

  check: {
    color: '#FFFFFF',

    fontSize: 38,
    fontWeight: '800',

    marginTop: -2,
  },

  successLabel: {
    color: '#7C3AED',

    fontSize: 11,
    fontWeight: '800',

    letterSpacing: 2,

    marginBottom: 8,
  },

  message: {
    color: '#111827',

    fontSize: 23,
    fontWeight: '800',

    lineHeight: 29,

    textAlign: 'center',

    paddingHorizontal: 5,
  },

  subtitle: {
    marginTop: 9,

    color: '#8A8F9C',

    fontSize: 14,

    lineHeight: 20,

    textAlign: 'center',

    paddingHorizontal: 12,
  },

  divider: {
    width: '100%',
    height: 1,

    backgroundColor: '#F1F1F5',

    marginTop: 23,
    marginBottom: 18,
  },

  button: {
    width: '100%',
    minHeight: 54,

    borderRadius: 17,

    backgroundColor: '#7C3AED',

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#7C3AED',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 7,
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '800',
  },

  arrow: {
    color: '#FFFFFF',

    fontSize: 21,
    fontWeight: '600',

    marginLeft: 9,
    marginTop: -1,
  },
});
const darkStyles = StyleSheet.create({
  card: { backgroundColor: '#201E29', borderWidth: 1, borderColor: '#343140' },
  dragHandle: { backgroundColor: '#4B4758' },
  message: { color: '#F8F7FC' },
  subtitle: { color: '#AAA5B5' },
  divider: { backgroundColor: '#343140' },
});