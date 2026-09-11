import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ZegoMenuBarStyle } from '@zegocloud/zego-uikit-prebuilt-call-rn';

let themeMode = 'dark';

const palettes = {
  dark: {
    background: '#101827',
    surface: '#1d2a3d',
    accent: '#33c6d8',
    text: '#f8fafc',
    muted: '#b7c4d4',
  },
  light: {
    background: '#edf7fa',
    surface: '#d7eef3',
    accent: '#07899a',
    text: '#102a43',
    muted: '#5b7288',
  },
};

function currentPalette() {
  return palettes[themeMode];
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map(part => part[0]).join('') || '?').toUpperCase();
}

export function setZegoCallThemeMode(nextThemeMode) {
  themeMode = nextThemeMode === 'light' ? 'light' : 'dark';
}

function CallBackdrop() {
  const palette = currentPalette();
  return (
    <View style={[styles.backdrop, { backgroundColor: palette.background }]}>
      <View style={[styles.glow, { backgroundColor: palette.accent }]} />
    </View>
  );
}

function CallAvatar({ invitee }) {
  const palette = currentPalette();
  return (
    <View style={[styles.avatarRing, { borderColor: palette.accent }]}> 
      <View style={[styles.avatar, { backgroundColor: palette.surface }]}>
        <Text style={[styles.avatarText, { color: palette.accent }]}>{initials(invitee?.userName)}</Text>
      </View>
    </View>
  );
}

function CallName({ name }) {
  const palette = currentPalette();
  return <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>{name}</Text>;
}

function CallState() {
  const palette = currentPalette();
  return <Text style={[styles.state, { color: palette.muted }]}>Calling…</Text>;
}

// These are the customization hooks exposed by Prebuilt Call 6.7.0. The
// connected call keeps the SDK's own full-screen video renderer and controls.
export function getZegoCallUiConfig(onCallEnd) {
  return {
    waitingPageConfig: {
      backgroundColor: currentPalette().background,
      backgroundBuilder: () => <CallBackdrop />,
      avatarBuilder: invitee => <CallAvatar invitee={invitee} />,
      nameBuilder: name => <CallName name={name} />,
      stateBuilder: () => <CallState />,
    },
    requireConfig: () => ({
      onCallEnd,
      bottomMenuBarConfig: {
        style: themeMode === 'dark' ? ZegoMenuBarStyle.dark : ZegoMenuBarStyle.light,
        hideAutomatically: false,
        hideByClick: false,
      },
      topMenuBarConfig: {
        isVisible: false,
      },
      audioVideoViewConfig: {
        useVideoViewAspectFill: true,
        showUserNameOnView: true,
      },
    }),
  };
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.14,
    top: '18%',
    alignSelf: 'center',
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 114,
    height: 114,
    borderRadius: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    marginTop: 20,
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '700',
  },
  state: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});
