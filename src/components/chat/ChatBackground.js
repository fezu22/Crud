import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const CROSS_COLUMNS = 7;
const CROSS_ROWS = 12;

/**
 * Decorative chat backdrop: two soft emerald glows plus a very subtle grid
 * of medical crosses. Purely visual, so it never intercepts touches.
 */
export default function ChatBackground({ theme }) {
  const crosses = useMemo(
    () =>
      Array.from({ length: CROSS_COLUMNS * CROSS_ROWS }, (_, index) => ({
        id: index,
        row: Math.floor(index / CROSS_COLUMNS),
        column: index % CROSS_COLUMNS,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
      <View style={[styles.glow, styles.glowTop, { backgroundColor: theme.glow }]} />
      <View style={[styles.glow, styles.glowBottom, { backgroundColor: theme.glowSoft }]} />
      <View style={styles.crossGrid}>
        {crosses.map(({ id, row, column }) => (
          <View
            key={id}
            style={{
              position: 'absolute',
              top: row * 90 + (row % 2) * 24 - 30,
              left: column * 62 + (column % 3) * 14 - 20,
            }}>
            <Cross color={theme.cross} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Cross({ color }) {
  return (
    <View style={styles.cross}>
      <View style={[styles.crossBar, styles.crossHorizontal, { backgroundColor: color }]} />
      <View style={[styles.crossBar, styles.crossVertical, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  glowTop: {
    top: -140,
    right: -110,
  },
  glowBottom: {
    bottom: -160,
    left: -130,
  },
  crossGrid: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cross: {
    width: 18,
    height: 18,
  },
  crossBar: {
    position: 'absolute',
    borderRadius: 2,
  },
  crossHorizontal: {
    width: 18,
    height: 5,
    top: 6.5,
    left: 0,
  },
  crossVertical: {
    width: 5,
    height: 18,
    left: 6.5,
    top: 0,
  },
});
