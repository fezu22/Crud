import React from 'react';
import { Image, Platform, View } from 'react-native';

/**
 * Small hand-drawn icons shared by the premium chat screens. They are built
 * from plain Views so they pick up the active chat theme colors and render
 * identically on every Android device without an icon-font dependency.
 */

export const CHAT_ICON_BUTTON_SIZE = 44;

export function getChatIconButtonTokens(theme, variant = 'secondary') {
  if (variant === 'primary') {
    return {
      backgroundColor: theme.outgoingBase || theme.primary,
      borderColor: 'transparent',
      iconColor: theme.outgoingInk || '#FFFFFF',
    };
  }

  return {
    backgroundColor: theme.surfaceAlt || theme.surface,
    borderColor: theme.line,
    iconColor: theme.primaryLight || theme.primary || theme.ink,
  };
}

export function CheckIcon({ color, size = 13 }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.16,
          height: size * 0.38,
          backgroundColor: color,
          borderRadius: size * 0.08,
          left: size * 0.18,
          top: size * 0.34,
          transform: [{ rotate: '42deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.16,
          height: size * 0.72,
          backgroundColor: color,
          borderRadius: size * 0.08,
          left: size * 0.52,
          top: size * 0.1,
          transform: [{ rotate: '-42deg' }],
        }}
      />
    </View>
  );
}

export function DoubleCheckIcon({ color, size = 15 }) {
  return (
    <View style={{ width: size * 1.55, height: size, flexDirection: 'row' }}>
      <View style={{ opacity: 0.55 }}>
        <CheckIcon color={color} size={size} />
      </View>
      <View style={{ marginLeft: -size * 0.45 }}>
        <CheckIcon color={color} size={size} />
      </View>
    </View>
  );
}

export function SendIcon({ color, size = 20 }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          borderTopWidth: size * 0.12,
          borderRightWidth: size * 0.12,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          top: size * 0.04,
          left: -size * 0.12,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.6,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
          top: size * 0.44,
          left: size * 0.1,
        }}
      />
    </View>
  );
}

function AndroidDrawableIcon({ color, height, name, size = 20, width = size }) {
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <Image
      resizeMode="contain"
      source={{ uri: name }}
      style={{
        width,
        height: height || size,
        tintColor: color,
      }}
    />
  );
}

export function VideoIcon({ color, size = 20 }) {
  return (
    <AndroidDrawableIcon color={color} height={size} name="medi_ic_videocam" size={size} width={size * 1.12} />
  );
}

export function PhoneIcon({ color, size = 20 }) {
  return (
    <AndroidDrawableIcon color={color} name="medi_ic_call" size={size} />
  );
}

export function MoreIcon({ color, size = 20 }) {
  const dot = { width: size * 0.14, height: size * 0.14, borderRadius: 99, backgroundColor: color };
  return (
    <View style={{ height: size, alignItems: 'center', justifyContent: 'space-between', paddingVertical: size * 0.1 }}>
      <View style={dot} />
      <View style={dot} />
      <View style={dot} />
    </View>
  );
}

export function ThemeIcon({ dark, size = 20, darkColor = '#FCD34D', lightColor = '#8B73FF' }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size * 0.11,
        borderColor: dark ? darkColor : lightColor,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [dark ? 'right' : 'left']: 0,
          width: dark ? '50%' : '100%',
          backgroundColor: dark ? darkColor : lightColor,
        }}
      />
    </View>
  );
}

export function MicIcon({ color, size = 20 }) {
  return (
    <AndroidDrawableIcon color={color} name="medi_ic_mic" size={size} />
  );
}

export function PaperclipIcon({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size * 0.62,
        height: size,
        borderRadius: size * 0.31,
        borderWidth: size * 0.12,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: size * 0.3,
          height: size * 0.62,
          borderRadius: size * 0.15,
          borderWidth: size * 0.1,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </View>
  );
}

export function ImageIcon({ color, size = 20 }) {
  return (
    <AndroidDrawableIcon color={color} name="medi_ic_photo_library" size={size} />
  );
}

export function CameraIcon({ color, size = 20 }) {
  return (
    <AndroidDrawableIcon color={color} name="medi_ic_photo_camera" size={size} />
  );
}

export function BackIcon({ color, size = 22 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: size * 0.22,
          borderBottomWidth: size * 0.22,
          borderRightWidth: size * 0.32,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.62,
          height: size * 0.14,
          borderRadius: 99,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function DocumentIcon({ color, size = 22 }) {
  return (
    <AndroidDrawableIcon color={color} name="medi_ic_insert_drive_file" size={size} />
  );
}
