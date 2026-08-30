import React, { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import COLORS from '../theme/colors';

export default function AutoHeightImage({ uri, style }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) {
          setAspectRatio(w / h);
        }
      },
      () => { }
    );
  }, [uri]);

  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={[
        styles.image,
        { aspectRatio },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
});
