import { NativeModules } from 'react-native';

const FALLBACK_API_HOST = '192.168.1.8';

function getMetroHost() {
  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  const hostMatch = scriptUrl?.match(/^https?:\/\/([^/:]+)/);

  return hostMatch?.[1];
}

const apiHost = getMetroHost() || FALLBACK_API_HOST;

export const API_BASE_URL = `http://${apiHost}:5000/api`;