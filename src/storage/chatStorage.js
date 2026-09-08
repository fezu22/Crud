import AsyncStorage from '@react-native-async-storage/async-storage';

const messagesKey = conversationId => `@medi_chat_messages_${conversationId}`;
const usersKey = userId => `@medi_chat_users_${userId}`;

async function readJson(key, fallback) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadCachedMessages(conversationId) {
  if (!conversationId) return Promise.resolve([]);
  return readJson(messagesKey(conversationId), []);
}

export async function saveCachedMessages(conversationId, messages) {
  if (!conversationId || !Array.isArray(messages)) return;
  try {
    await AsyncStorage.setItem(
      messagesKey(conversationId),
      JSON.stringify(messages.slice(-100)),
    );
  } catch {
    // Cache failures should never interrupt sending or receiving messages.
  }
}

export function loadCachedChatUsers(userId) {
  if (!userId) return Promise.resolve([]);
  return readJson(usersKey(String(userId)), []);
}

export async function saveCachedChatUsers(userId, users) {
  if (!userId || !Array.isArray(users)) return;
  try {
    await AsyncStorage.setItem(usersKey(String(userId)), JSON.stringify(users));
  } catch {
    // Cache failures should never block opening the new-chat picker.
  }
}
