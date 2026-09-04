import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Minimal chat backdrop: plain dark canvas plus one very subtle purple
 * glow in the top corner. No cards or bright surfaces.
 */
export default function ChatBackground({ theme }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
      <View style={[styles.glow, { backgroundColor: theme.glow }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -170,
    right: -130,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
});
