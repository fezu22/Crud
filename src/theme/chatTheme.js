// Chat palettes share the same purple accents while adapting the canvas and
// surfaces to the app's selected appearance.
const darkChatTheme = {
  mode: 'dark',
  background: '#100E16',
  surface: '#100E16',
  surfaceAlt: '#211F2B',
  incomingBubble: '#211F2B',
  incomingBorder: '#2B2836',
  outgoingBase: '#6C4DF6',
  outgoingMid: '#7C5FF8',
  outgoingTop: '#8B73FF',
  primary: '#6C4DF6',
  primaryLight: '#8B73FF',
  ink: '#F5F3FA',
  muted: '#A8A4B7',
  line: '#2B2836',
  onlineDot: '#3B82F6',
  offlineDot: '#EF4444',
  tick: '#A8A4B7',
  readTick: '#8B73FF',
  danger: '#F87171',
  glow: 'rgba(108, 77, 246, 0.08)',
  separatorBg: '#211F2B',
  separatorText: '#A8A4B7',
  composerField: '#211F2B',
  barStyle: 'light-content',
};

const lightChatTheme = {
  mode: 'light',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F7FC',
  incomingBubble: '#F1EEFF',
  incomingBorder: '#EAE7F2',
  outgoingBase: '#6C4DF6',
  outgoingMid: '#7C5FF8',
  outgoingTop: '#8B73FF',
  primary: '#6C4DF6',
  primaryLight: '#6C4DF6',
  ink: '#29243B',
  muted: '#817C94',
  line: '#EAE7F2',
  onlineDot: '#2563EB',
  offlineDot: '#DC2626',
  tick: '#817C94',
  readTick: '#6C4DF6',
  danger: '#DC2626',
  glow: 'rgba(108, 77, 246, 0.06)',
  separatorBg: '#F1EEFF',
  separatorText: '#817C94',
  composerField: '#F8F7FC',
  barStyle: 'dark-content',
};

export const chatTheme = darkChatTheme;

export function getChatTheme(mode = 'dark') {
  return mode === 'light' ? lightChatTheme : darkChatTheme;
}
