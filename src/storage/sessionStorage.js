import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@medi_user_token';
const USER_KEY = '@medi_user_data';

export async function loadSession() {
  const [token, rawUser] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  return { token, user: rawUser ? JSON.parse(rawUser) : null };
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}
