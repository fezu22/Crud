import AsyncStorage from '@react-native-async-storage/async-storage';

const messagesKey = (userId, conversationId) =>
  `@medi_chat_messages_${String(userId)}_${conversationId}`;
const usersKey = userId => `@medi_chat_users_${userId}`;
const conversationsKey = userId => `@medi_chat_list_${userId}`;
const pendingWrites = new Map();

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

function writeJson(key, value) {
  const previous = pendingWrites.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() => AsyncStorage.setItem(key, JSON.stringify(value)))
    .catch(() => {});
  pendingWrites.set(key, next);
  return next;
}

function removeKey(key) {
  const previous = pendingWrites.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() => AsyncStorage.removeItem(key))
    .catch(() => {});
  pendingWrites.set(key, next);
  return next;
}

export function conversationKeyFor(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].map(String).sort().join('_');
}

export function loadCachedMessages(userId, conversationId) {
  if (!userId || !conversationId) return Promise.resolve([]);
  return readJson(messagesKey(userId, conversationId), []);
}

export async function saveCachedMessages(userId, conversationId, messages) {
  if (!userId || !conversationId || !Array.isArray(messages)) return;
  await writeJson(messagesKey(userId, conversationId), messages.slice(-100));
}

export async function clearCachedMessages(userId, conversationId) {
  if (!userId || !conversationId) return;
  await removeKey(messagesKey(userId, conversationId));
}

export function loadCachedChatUsers(userId) {
  if (!userId) return Promise.resolve([]);
  return readJson(usersKey(String(userId)), []);
}

export async function saveCachedChatUsers(userId, users) {
  if (!userId || !Array.isArray(users)) return;
  await writeJson(usersKey(String(userId)), users);
}

export function loadCachedConversations(userId) {
  if (!userId) return Promise.resolve([]);
  return readJson(conversationsKey(String(userId)), []);
}

export async function saveCachedConversations(userId, conversations) {
  if (!userId || !Array.isArray(conversations)) return;
  await writeJson(conversationsKey(String(userId)), conversations);
}

export async function removeCachedConversations(userId, otherUserIds) {
  if (!userId || !Array.isArray(otherUserIds) || !otherUserIds.length) return;
  const removedIds = new Set(otherUserIds.map(String));
  const current = await loadCachedConversations(userId);
  await writeJson(
    conversationsKey(String(userId)),
    current.filter(item => !removedIds.has(String(item?.user?.id || item?.user?._id))),
  );
}
