import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Round call-control button with an optional active highlight.
 */
export default function CallButton({ children, onPress, active, activeColor, danger, size = 58, accessibilityLabel }) {
  const background = danger
    ? '#DC2626'
    : active
      ? activeColor || 'rgba(255,255,255,0.95)'
      : 'rgba(255,255,255,0.14)';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  );
}

export function CallLabel({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
});
