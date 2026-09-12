import { NativeModules, Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://crud-ptx8.onrender.com/api';
const PRODUCTION_API_HOST = 'crud-ptx8.onrender.com';

// `yarn android` runs `adb reverse tcp:5000 tcp:5000`, so Android can
// reach the backend through localhost without depending on a changing LAN IP.
const LAN_FALLBACK_HOST = '127.0.0.1';

function getMetroHost() {
  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  const hostMatch = scriptUrl?.match(/^https?:\/\/([^/:]+)/);
  return hostMatch?.[1];
}

export function resolveApiHost() {
  if (!__DEV__) {
    return PRODUCTION_API_HOST;
  }

  const metroHost = getMetroHost();

  // Prefer the host that served the JS bundle so Wi-Fi devices can reach the
  // local backend even when adb reverse is not available.
  if (Platform.OS === 'android') {
    return metroHost || LAN_FALLBACK_HOST;
  }

  return metroHost || LAN_FALLBACK_HOST;
}

export const API_BASE_URL = __DEV__
  ? `http://${resolveApiHost()}:5000/api`
  : PRODUCTION_API_URL;
