import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = '@medi_user_token';
const USER_KEY = '@medi_user_data';
const ACTIVE_ACCOUNT_KEY = '@medi_active_account';
const BIOMETRIC_PREFIX = '@medi_biometric_enabled_';
const SESSION_SERVICE = 'com.medi.auth.session';

function accountId(user) {
  return user?.id || user?._id || user?.email || user?.phoneNumber || null;
}

function biometricKey(user) {
  const id = accountId(user);
  return id ? `${BIOMETRIC_PREFIX}${id}` : null;
}

function secureOptions(biometric = false) {
  return {
    service: SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    ...(biometric ? { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET } : {}),
  };
}

function profileImageKey(userId) {
  return `@medi_profile_image_${userId}`;
}

export async function loadSession({ authenticationPrompt, biometricProtected = false } = {}) {
  let secure = false;
  try {
    secure = await Keychain.getGenericPassword({
      // The protected credential must always be read with the same service and
      // BIOMETRY_CURRENT_SET access-control configuration used to write it.
      ...secureOptions(biometricProtected),
      ...(authenticationPrompt ? { authenticationPrompt } : {}),
    });
  } catch (error) {
    if (authenticationPrompt) throw error;
  }
  if (secure) {
    try {
      const parsed = JSON.parse(secure.password);
      if (parsed?.token && parsed?.user) return { ...parsed, source: 'secure' };
    } catch {
      // A malformed secure item must not erase a valid legacy session.
    }
  }

  const [token, rawUser] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  return { token, user: rawUser ? JSON.parse(rawUser) : null, source: 'legacy' };
}

export async function saveSession(token, user) {
  const biometricEnabled = await isBiometricEnabled(user);
  const payload = JSON.stringify({ token, user });
  await Keychain.setGenericPassword(accountId(user) || 'medi-user', payload, secureOptions(biometricEnabled));

  // Keep legacy credentials only while biometric login is disabled, so an
  // interrupted migration never logs out an existing user. Once enabled, the
  // JWT remains solely in the OS-backed secure item.
  if (biometricEnabled) await AsyncStorage.removeItem(TOKEN_KEY);
  else await AsyncStorage.setItem(TOKEN_KEY, token);
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  if (accountId(user)) await AsyncStorage.setItem(ACTIVE_ACCOUNT_KEY, String(accountId(user)));
}

export async function clearSession() {
  const rawUser = await AsyncStorage.getItem(USER_KEY);
  const biometricPreference = biometricKey(rawUser ? JSON.parse(rawUser) : null);
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
    AsyncStorage.removeItem(ACTIVE_ACCOUNT_KEY),
    Keychain.resetGenericPassword({ service: SESSION_SERVICE }),
    ...(biometricPreference ? [AsyncStorage.removeItem(biometricPreference)] : []),
  ]);
}

export async function isBiometricEnabled(user) {
  const key = biometricKey(user);
  return key ? (await AsyncStorage.getItem(key)) === 'true' : false;
}

export async function getBiometricSessionState() {
  const rawUser = await AsyncStorage.getItem(USER_KEY);
  const user = rawUser ? JSON.parse(rawUser) : null;
  return { user, enabled: await isBiometricEnabled(user) };
}

export async function getSupportedBiometryType() {
  return Keychain.getSupportedBiometryType();
}

export async function enableBiometricForSession(token, user) {
  const type = await getSupportedBiometryType();
  if (!type) throw new Error('Biometric authentication is unavailable or no biometrics are enrolled on this device.');

  const key = biometricKey(user);
  if (!key) throw new Error('Your account could not be identified for biometric login.');

  await Keychain.setGenericPassword(accountId(user), JSON.stringify({ token, user }), secureOptions(true));
  try {
    const unlocked = await Keychain.getGenericPassword({
      ...secureOptions(true),
      authenticationPrompt: { title: 'Unlock Medi', subtitle: 'Use your biometric to enable biometric login.' },
    });
    if (!unlocked) throw new Error('Biometric authentication was cancelled.');
    await AsyncStorage.setItem(key, 'true');
    await AsyncStorage.setItem(ACTIVE_ACCOUNT_KEY, String(accountId(user)));
    // The token is now protected by the Android Keystore / iOS Keychain.
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    await Keychain.setGenericPassword(accountId(user), JSON.stringify({ token, user }), secureOptions(false));
    throw error;
  }
}

export async function disableBiometricForSession(token, user) {
  const key = biometricKey(user);
  if (key) await AsyncStorage.removeItem(key);
  await Keychain.setGenericPassword(accountId(user) || 'medi-user', JSON.stringify({ token, user }), secureOptions(false));
}

export async function loadProfileImage(userId) {
  if (!userId) return null;
  return AsyncStorage.getItem(profileImageKey(userId));
}

export async function saveProfileImage(userId, uri) {
  if (!userId || !uri) return;
  await AsyncStorage.setItem(profileImageKey(userId), uri);
}
