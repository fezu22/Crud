import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAdminChat, getChatUsers, getConversations } from '../services/api';
import PremiumChatScreen from './chat/PremiumChatScreen';
import { formatClock } from '../components/chat/MessageBubble';
import { DocumentIcon } from '../components/chat/ChatIcons';
import { createCallSocket } from '../services/callService';
import {
  loadCachedChatUsers,
  saveCachedChatUsers,
} from '../storage/chatStorage';

function initials(name) {
  return String(name || 'User')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isRealChatUser(item, currentUserId) {
  const id = String(item?.id || item?._id || '');
  return id && !id.startsWith('demo-') && id !== String(currentUserId);
}

function isDocumentPreview(conversation) {
  const type = String(conversation?.lastMessageType || '').toLowerCase();
  const preview = String(conversation?.lastMessage || '');

  return (
    type === 'document' ||
    type === 'pdf' ||
    preview === '[Document]' ||
    /\.(pdf|docx?|txt|csv|xlsx?|pptx?|zip|rtf|odt|ods|odp)$/i.test(preview)
  );
}

function UserPicker({ visible, users, adminContact, query, loading, onQuery, onClose, onSelect }) {
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx)
    ),
    onPanResponderMove: (_, gesture) => {
      sheetTranslateY.setValue(Math.max(0, gesture.dy));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90 || gesture.vy > 0.8) {
        Animated.timing(sheetTranslateY, {
          toValue: 700,
          duration: 160,
          useNativeDriver: true,
        }).start(onClose);
      } else {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    },
  })).current;

  useEffect(() => {
    if (visible) sheetTranslateY.setValue(0);
  }, [sheetTranslateY, visible]);

  useEffect(() => {
    if (!loading) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [loading, skeletonOpacity]);

  const closePicker = () => {
    onClose();
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closePicker}>
      <View className="flex-1 justify-end bg-black/60">
        <Animated.View
          {...panResponder.panHandlers}
          style={{ transform: [{ translateY: sheetTranslateY }] }}
          className="max-h-[86%] rounded-t-[28px] bg-canvas px-5 pb-7 pt-3">
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>
          <View className="mb-4 flex-row items-center justify-between">
            {loading ? (
              <Animated.View style={{ opacity: skeletonOpacity }} className="h-7 w-28 rounded-lg bg-surfaceAlt" />
            ) : (
              <Text className="text-2xl font-extrabold text-ink">New chat</Text>
            )}
            {
              <TouchableOpacity onPressIn={closePicker} accessibilityLabel="Close new chat">
              <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            }
          </View>
          {loading ? (
            <Animated.View style={{ opacity: skeletonOpacity }} className="mb-3 h-12 rounded-2xl bg-surfaceAlt" />
          ) : (
            <TextInput
              className="mb-3 h-12 rounded-2xl border border-line bg-surface px-4 text-ink"
              placeholder="Search users..."
              placeholderTextColor="#817C94"
              value={query}
              onChangeText={onQuery}
              autoFocus
            />
          )}
          {!loading && adminContact ? (
            <TouchableOpacity
              className="mb-3 flex-row items-center rounded-2xl border border-brand/30 bg-[#F1EEFF] p-4 dark:border-[#8B78FF] dark:bg-[#2A2440]"
              onPress={() => onSelect(adminContact)}
              accessibilityLabel="Chat with Admin">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-brand">
                <Text className="font-extrabold text-white">A</Text>
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-ink dark:text-white">Chat with Admin</Text>
                <Text className="mt-1 text-xs text-muted dark:text-[#C4BDD4]">
                  {adminContact.online ? 'Online' : 'Get help from the Medi team'}
                </Text>
              </View>
              <Text className="text-2xl text-brand">&gt;</Text>
            </TouchableOpacity>
          ) : null}
          {loading ? (
            <Animated.View style={{ opacity: skeletonOpacity }} className="py-2">
              {[0, 1, 2, 3].map(index => (
                <View key={index} className="mb-3 flex-row items-center border-b border-line py-3">
                  <View className="mr-3 h-12 w-12 rounded-full bg-surfaceAlt" />
                  <View className="flex-1">
                    <View className="mb-2 h-4 w-32 rounded-full bg-surfaceAlt" />
                    <View className="h-3 w-24 rounded-full bg-surfaceAlt" />
                  </View>
                  <View className="h-5 w-5 rounded-full bg-surfaceAlt" />
                </View>
              ))}
            </Animated.View>
          ) : (
            <FlatList
              data={users}
              keyboardShouldPersistTaps="handled"
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center border-b border-line py-3"
                  onPress={() => onSelect(item)}
                  accessibilityLabel={`Chat with ${item.name || 'user'}`}>
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-[#EAE5FF]">
                    <Text className="font-extrabold text-brand">{initials(item.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <View
                        className={`mr-2 h-2 w-2 rounded-full ${item.online ? 'bg-[#3B82F6]' : 'bg-[#EF4444]'}`}
                      />
                      <Text className="font-bold text-ink">{item.name || 'Medi user'}</Text>
                    </View>
                    <Text className="mt-1 text-xs text-muted">
                      {item.online ? 'Online' : item.email || 'Available to chat'}
                    </Text>
                  </View>
                  <Text className="text-2xl text-brand">›</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="py-10 text-center text-muted">
                  {query ? 'No users found.' : 'No other registered users yet.'}
                </Text>
              }
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function ChatScreen({ token, user, onError, themeMode = 'dark' }) {
  const [conversations, setConversations] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [active, setActive] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pickerUsers, setPickerUsers] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const onErrorRef = useRef(onError);
  const currentUserId = user?.id || user?._id;

  const refreshConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const value = await getConversations(token);
      setConversations(Array.isArray(value) ? value : []);
    } catch (error) {
      onErrorRef.current?.(error);
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!pickerOpen || !currentUserId) return undefined;

    let mounted = true;
    const timer = setTimeout(async () => {
      setPickerLoading(true);

      try {
        const users = await getChatUsers(token, query);
        if (mounted) {
          const realUsers = (Array.isArray(users) ? users : [])
            .filter(item => isRealChatUser(item, currentUserId));
          setPickerUsers(realUsers);
          if (!query) saveCachedChatUsers(currentUserId, realUsers);
        }
      } catch (error) {
        if (mounted) {
          const cached = await loadCachedChatUsers(currentUserId);
          const fallbackUsers = cached.filter(item => isRealChatUser(item, currentUserId));
          setPickerUsers(fallbackUsers);
          if (!fallbackUsers.length) onErrorRef.current?.(error);
        }
      } finally {
        if (mounted) setPickerLoading(false);
      }
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [currentUserId, pickerOpen, query, token]);

  useEffect(() => {
    if (!token || !currentUserId) return undefined;
    const socket = createCallSocket(token);
    const updatePresence = event => {
      const id = String(event?.userId || event?.fromUserId || '');
      if (!id) return;
      setPickerUsers(current => current.map(item => (
        String(item.id) === id ? { ...item, online: Boolean(event.online) } : item
      )));
      setConversations(current => current.map(item => (
        String(item.user?.id) === id
          ? { ...item, user: { ...item.user, online: Boolean(event.online) } }
          : item
      )));
      setAdminContact(current => current && String(current.id) === id
        ? { ...current, online: Boolean(event.online) }
        : current);
    };
    socket.on('presence:update', updatePresence);
    return () => {
      socket.off('presence:update', updatePresence);
      socket.disconnect();
    };
  }, [currentUserId, token]);

  useEffect(() => {
    refreshConversations();
    return undefined;
  }, [refreshConversations]);

  useEffect(() => {
    let mounted = true;

    getAdminChat(token)
      .then(value => {
        if (mounted) setAdminContact(value || null);
      })
      .catch(error => {
        // A missing admin is a server setup issue, not a reason to break chat.
        if (mounted && error?.status !== 404) onErrorRef.current?.(error);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    const handleHardwareBack = () => {
      if (pickerOpen) {
        setPickerOpen(false);
        return true;
      }

      if (active) {
        setActive(null);
        refreshConversations();
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [active, pickerOpen, refreshConversations]);

  if (active) {
    return (
      <PremiumChatScreen
        contact={active}
        token={token}
        user={user}
        themeMode={themeMode}
        onError={onError}
        onBack={() => {
          setActive(null);
          refreshConversations();
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-start justify-between px-6 pb-5 pt-6">
        <View>
          <Text className="text-[10px] font-extrabold tracking-[2px] text-brand">
            CONNECT WITH YOUR COMMUNITY
          </Text>
          <Text className="mt-1 text-4xl font-extrabold text-ink">Chat</Text>
        </View>
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-brand"
          onPress={() => {
            setQuery('');
            setPickerUsers([]);
            setPickerLoading(true);
            setPickerOpen(true);
          }}
          accessibilityLabel="Start a new chat">
          <Text className="text-3xl font-light text-white">+</Text>
        </TouchableOpacity>
      </View>

      <Text className="px-6 pb-3 text-xs font-extrabold uppercase tracking-[1.5px] text-muted">
        Conversations
      </Text>

      {loadingConversations ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#6C4DF6" />
        </View>
      ) : conversations.length ? (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.user.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mx-6 mb-3 flex-row items-center rounded-2xl border border-line bg-surface p-4"
              onPress={() => setActive(item.user)}
              accessibilityLabel={`Open chat with ${item.user.name || 'user'}`}>
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-brand">
                <Text className="font-extrabold text-white">{initials(item.user.name)}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-extrabold text-ink" numberOfLines={1}>
                    {item.user.name || 'Medi user'}
                  </Text>
                  <Text className="ml-2 text-[10px] font-semibold text-muted">
                    {formatClock(item.lastMessageAt)}
                  </Text>
                </View>
                <View className="mt-1 flex-row items-center">
                  {isDocumentPreview(item) ? (
                    <View className="mr-2 h-6 w-6 items-center justify-center rounded-md bg-brand">
                      <DocumentIcon color="#FFFFFF" size={14} />
                    </View>
                  ) : null}
                  <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl text-brand">›</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text className="px-6 py-8 text-center text-muted">No conversations yet.</Text>
      )}

      <View className="mx-6 mt-4 rounded-2xl border border-dashed border-line p-5">
        <Text className="text-center text-sm font-bold text-ink">Start a new conversation</Text>
        <Text className="mt-1 text-center text-xs leading-5 text-muted">
          Tap the + button above to choose any registered user.
        </Text>
      </View>

      <UserPicker
        visible={pickerOpen}
        users={pickerUsers}
        adminContact={adminContact}
        query={query}
        loading={pickerLoading}
        onQuery={setQuery}
          onClose={() => {
            setPickerOpen(false);
            setQuery('');
          }}
        onSelect={contact => {
          setPickerOpen(false);
          setActive(contact);
        }}
      />
    </View>
  );
}
