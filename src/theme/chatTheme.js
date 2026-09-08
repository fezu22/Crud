// Cinematic cyan accents with a light variant for the app's appearance setting.
const darkChatTheme = {
  mode: 'dark',
  background: '#050505',
  surface: '#0D0D0D',
  surfaceAlt: '#161616',
  incomingBubble: '#161616',
  incomingBorder: '#242429',
  outgoingBase: '#00E5FF',
  outgoingMid: '#00D6EE',
  outgoingTop: '#00C8E0',
  outgoingInk: '#002C33',
  outgoingMuted: '#24545C',
  primary: '#00C8E0',
  primaryLight: '#00E5FF',
  ink: '#F6F6FA',
  muted: '#888898',
  line: '#242429',
  onlineDot: '#00E5FF',
  offlineDot: '#EF4444',
  tick: '#367079',
  readTick: '#003E49',
  danger: '#F87171',
  glow: 'rgba(0, 229, 255, 0.06)',
  separatorBg: '#102125',
  separatorText: '#79CED8',
  composerField: '#111111',
  barStyle: 'light-content',
};

const lightChatTheme = {
  ...darkChatTheme,
  mode: 'light',
  background: '#F7FCFD',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF4F6',
  incomingBubble: '#FFFFFF',
  incomingBorder: '#DCEAED',
  primary: '#007F94',
  primaryLight: '#007F94',
  ink: '#102C33',
  muted: '#58747C',
  line: '#DCEAED',
  onlineDot: '#2563EB',
  offlineDot: '#DC2626',
  danger: '#DC2626',
  separatorBg: '#E0F5F8',
  separatorText: '#007083',
  composerField: '#FFFFFF',
  barStyle: 'dark-content',
};

export const chatTheme = darkChatTheme;

export function getChatTheme(mode = 'dark') {
  return mode === 'light' ? lightChatTheme : darkChatTheme;
}
