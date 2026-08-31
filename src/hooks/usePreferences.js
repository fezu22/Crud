import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { requestNotificationPermission } from '../services/notifications';

const KEY = '@medi_preferences';
const defaults = { theme: 'light', notifications: true };

export default function usePreferences() {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(value => {
        const saved = value ? JSON.parse(value) : defaults;
        setPreferences(saved);
        setColorScheme(saved.theme);
        setReady(true);
      })
      .catch(() => {
        setColorScheme(defaults.theme);
        setReady(true);
      });
  }, [setColorScheme]);

  async function update(next) {
    setPreferences(next);
    setColorScheme(next.theme);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }
  const toggleTheme = () =>
    update({
      ...preferences,
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  const toggleNotifications = async () => {
    const enabling = !preferences.notifications;
    if (enabling && !(await requestNotificationPermission())) return false;
    await update({ ...preferences, notifications: enabling });
    return true;
  };
  return { ...preferences, ready, toggleTheme, toggleNotifications };
}
