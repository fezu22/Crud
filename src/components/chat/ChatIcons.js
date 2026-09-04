import React from 'react';
import { View } from 'react-native';

/**
 * Small hand-drawn icons shared by the premium chat screens. They are built
 * from plain Views so they pick up the active chat theme colors and render
 * identically on every Android device without an icon-font dependency.
 */

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
    <View style={{ width: size, height: size, transform: [{ rotate: '90deg' }] }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.38,
          borderRightWidth: size * 0.38,
          borderBottomWidth: size * 0.9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
    </View>
  );
}

export function VideoIcon({ color, size = 20 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.85,
          height: size * 0.62,
          borderRadius: size * 0.16,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: size * 0.17,
          borderBottomWidth: size * 0.17,
          borderLeftWidth: size * 0.4,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
          marginLeft: -size * 0.06,
        }}
      />
    </View>
  );
}

export function PhoneIcon({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size * 0.62,
        height: size,
        borderTopLeftRadius: size * 0.34,
        borderTopRightRadius: size * 0.34,
        borderBottomLeftRadius: size * 0.42,
        borderBottomRightRadius: size * 0.42,
        backgroundColor: color,
        transform: [{ rotate: '-38deg' }],
      }}
    />
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

export function ThemeIcon({ dark, size = 20, darkColor = '#FCD34D', lightColor = '#10B981' }) {
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
    <View style={{ width: size * 0.6, height: size, alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.52,
          borderRadius: size * 0.2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.56,
          height: size * 0.34,
          borderWidth: size * 0.09,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.3,
          marginTop: size * 0.06,
        }}
      />
      <View
        style={{
          width: size * 0.08,
          height: size * 0.16,
          backgroundColor: color,
          borderRadius: 99,
        }}
      />
      <View
        style={{
          width: size * 0.3,
          height: size * 0.08,
          backgroundColor: color,
          borderRadius: 99,
        }}
      />
    </View>
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
      }}
    />
  );
}

export function CameraIcon({ color, size = 20 }) {
  return (
    <View style={{ width: size, height: size * 0.78, alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.34,
          height: size * 0.16,
          backgroundColor: color,
          borderTopLeftRadius: size * 0.08,
          borderTopRightRadius: size * 0.08,
        }}
      />
      <View
        style={{
          width: size,
          height: size * 0.64,
          borderRadius: size * 0.16,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: size * 0.17,
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}
        />
      </View>
    </View>
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
    <View
      style={{
        width: size * 0.78,
        height: size,
        borderRadius: size * 0.1,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: size * 0.14,
      }}
    >
      <View
        style={{
          width: size * 0.44,
          height: size * 0.08,
          borderRadius: 99,
          backgroundColor: 'rgba(255,255,255,0.55)',
          marginBottom: size * 0.05,
        }}
      />
      <View
        style={{
          width: size * 0.44,
          height: size * 0.08,
          borderRadius: 99,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }}
      />
    </View>
  );
}
