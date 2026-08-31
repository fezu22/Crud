import { NativeModules, Platform } from 'react-native';

// Android development uses `adb reverse tcp:5000 tcp:5000`, so localhost on
// the device maps safely to this computer without depending on changing Wi-Fi IPs.
const ANDROID_DEV_HOST = '127.0.0.1';
const LAN_FALLBACK_HOST = '192.168.1.7';

function getMetroHost() {
  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  const hostMatch = scriptUrl?.match(/^https?:\/\/([^/:]+)/);
  return hostMatch?.[1];
}

export function resolveApiHost() {
  if (__DEV__ && Platform.OS === 'android') return ANDROID_DEV_HOST;
  return getMetroHost() || LAN_FALLBACK_HOST;
}

export const API_BASE_URL = `http://${resolveApiHost()}:5000/api`;
