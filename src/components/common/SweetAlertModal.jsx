import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const colors = {
  warning: '#F59E0B',
  danger: '#DC2626',
  success: '#16A34A',
  info: '#2563EB',
};

export default function SweetAlertModal({
  visible,
  type = 'info',
  title,
  message,
  primaryText = 'Continue',
  secondaryText,
  cancelText = 'Cancel',
  onPrimary,
  onSecondary,
  onCancel,
  loading = false,
  theme,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  const accent = colors[type] || colors.info;
  const backgroundColor = theme?.surface || '#FFFFFF';
  const ink = theme?.ink || '#172033';
  const muted = theme?.muted || '#667085';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <Animated.View style={[styles.card, {
          backgroundColor,
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
        }]}>
          <View style={[styles.icon, { backgroundColor: `${accent}20` }]}>
            <Text style={[styles.iconText, { color: accent }]}>{type === 'success' ? '✓' : '!'}</Text>
          </View>
          <Text style={[styles.title, { color: ink }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: muted }]}>{message}</Text> : null}
          <View style={styles.actions}>
            {secondaryText ? <Pressable disabled={loading} onPress={onSecondary} style={[styles.secondary, { borderColor: accent }]}>
              <Text style={[styles.secondaryText, { color: accent }]}>{secondaryText}</Text>
            </Pressable> : null}
            <Pressable disabled={loading} onPress={onPrimary} style={[styles.primary, { backgroundColor: accent, opacity: loading ? 0.6 : 1 }]}>
              <Text style={styles.primaryText}>{loading ? 'Please wait…' : primaryText}</Text>
            </Pressable>
            {cancelText ? <Pressable disabled={loading} onPress={onCancel} style={styles.cancel}>
              <Text style={[styles.cancelText, { color: muted }]}>{cancelText}</Text>
            </Pressable> : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7, 12, 24, 0.56)', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 12 },
  icon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconText: { fontSize: 28, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  actions: { width: '100%', marginTop: 22, gap: 10 },
  primary: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondary: { minHeight: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryText: { fontSize: 15, fontWeight: '800' },
  cancel: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
});
