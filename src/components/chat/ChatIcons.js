import React from 'react';
import { View } from 'react-native';

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

export function VideoIcon({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size * 1.2,
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.58,
          borderRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: size * 0.22,
          borderBottomWidth: size * 0.22,
          borderLeftWidth: size * 0.36,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
          marginLeft: size * 0.02,
        }}
      />
    </View>
  );
}

export function PhoneIcon({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: '-38deg' }],
      }}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.22,
          top: size * 0.37,
          width: size * 0.56,
          height: size * 0.24,
          borderRadius: size * 0.12,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.06,
          top: size * 0.2,
          width: size * 0.36,
          height: size * 0.42,
          borderTopLeftRadius: size * 0.2,
          borderTopRightRadius: size * 0.1,
          borderBottomLeftRadius: size * 0.18,
          borderBottomRightRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.06,
          bottom: size * 0.2,
          width: size * 0.36,
          height: size * 0.42,
          borderTopLeftRadius: size * 0.1,
          borderTopRightRadius: size * 0.2,
          borderBottomLeftRadius: size * 0.1,
          borderBottomRightRadius: size * 0.18,
          backgroundColor: color,
        }}
      />
    </View>
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
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.58,
          borderRadius: size * 0.21,
          backgroundColor: color,
          marginTop: size * 0.04,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: size * 0.26,
          width: size * 0.12,
          height: size * 0.34,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.18,
          top: size * 0.26,
          width: size * 0.12,
          height: size * 0.34,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.55,
          width: size * 0.44,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.12,
          height: size * 0.22,
          borderRadius: size * 0.06,
          marginTop: size * 0.04,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.46,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
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
    <View
      style={{
        width: size,
        height: size * 0.84,
        position: 'relative',
      }}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.08,
          top: 0,
          width: size * 0.82,
          height: size * 0.66,
          borderRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: size * 0.82,
          height: size * 0.66,
          borderRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.14,
          top: size * 0.32,
          width: size * 0.36,
          height: size * 0.36,
          backgroundColor: 'rgba(255,255,255,0.35)',
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.18,
          top: size * 0.34,
          width: size * 0.32,
          height: size * 0.32,
          backgroundColor: 'rgba(255,255,255,0.35)',
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.26,
          top: size * 0.14,
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }}
      />
    </View>
  );
}

export function CameraIcon({ color, size = 20 }) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.82,
        position: 'relative',
      }}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: 0,
          width: size * 0.3,
          height: size * 0.18,
          borderTopLeftRadius: size * 0.06,
          borderTopRightRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: size,
          height: size * 0.7,
          borderRadius: size * 0.12,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: size * 0.18,
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          right: size * 0.16,
          top: size * 0.2,
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }}
      />
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
        width: size * 0.84,
        height: size,
        position: 'relative',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size * 0.62,
          height: size,
          borderTopLeftRadius: size * 0.08,
          borderBottomLeftRadius: size * 0.08,
          borderBottomRightRadius: size * 0.08,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.02,
          top: size * 0.22,
          width: size * 0.28,
          height: size * 0.78,
          borderBottomRightRadius: size * 0.08,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.02,
          top: 0,
          width: 0,
          height: 0,
          borderTopWidth: size * 0.3,
          borderLeftWidth: size * 0.3,
          borderTopColor: color,
          borderLeftColor: 'transparent',
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.02,
          top: size * 0.22,
          width: size * 0.3,
          height: size * 0.08,
          borderRadius: size * 0.04,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
