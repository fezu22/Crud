import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  FadeSlideIn,
  ModalBackdrop,
  MOTION,
  PressableScale,
  SkeletonBlock,
} from '../components/motion';
import PresenceIndicator from '../components/chat/PresenceIndicator';
import {
  deleteConversation,
  deleteConversationForEveryone,
  getAdminChat,
  getChatUsers,
  getConversations,
} from '../services/api';
import PremiumChatScreen from './chat/PremiumChatScreen';
import { formatClock } from '../components/chat/MessageBubble';
import { DocumentIcon } from '../components/chat/ChatIcons';
import { createSocket } from '../services/socketService';
import { vars } from 'nativewind';
import { getChatTheme } from '../theme/chatTheme';
import SweetAlertModal from '../components/common/SweetAlertModal';
import {
  clearCachedMessages,
  conversationKeyFor,
  loadCachedConversations,
  loadCachedChatUsers,
  removeCachedConversations,
  saveCachedConversations,
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

function UserPicker({ visible, users, adminContact, query, loading, onQuery, onClose, onSelect, theme }) {
  // Reanimated + Gesture Handler sheet: the drag now runs on the UI thread so
  // it stays smooth while the user list is still loading.
  const translateY = useSharedValue(0);

  const closePicker = useCallback(() => {
    onClose();
    Keyboard.dismiss();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onChange(event => {
      translateY.value = Math.max(0, translateY.value + event.changeY);
    })
    .onEnd(event => {
      if (translateY.value > 90 || event.velocityY > 800) {
        translateY.value = withTiming(700, { duration: 180 }, finished => {
          if (finished) runOnJS(closePicker)();
        });
      } else {
        translateY.value = withSpring(0, MOTION.softSpring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) translateY.value = 0;
  }, [translateY, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closePicker}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ModalBackdrop
          visible={visible}
          className="flex-1 justify-end bg-black/60"
          style={vars({
            '--color-canvas': theme.background, '--color-surface': theme.surfaceAlt,
            '--color-ink': theme.ink, '--color-muted': theme.muted, '--color-line': theme.line,
          })}>
          <ReanimatedAnimated.View
            style={[{ minHeight: '65%', backgroundColor: theme.background }, sheetStyle]}
            className="max-h-[86%] rounded-t-[28px] bg-canvas px-5 pb-7 pt-3">
            <GestureDetector gesture={panGesture}>
              <View className="mb-4 items-center py-3">
                <View className="h-1 w-10 rounded-full bg-line" />
              </View>
            </GestureDetector>
          <View className="mb-4 flex-row items-center justify-between">
            {loading ? (
              <SkeletonBlock color={theme.surfaceAlt} className="h-7 w-28 rounded-lg" style={{ height: 28, width: 112 }} />
            ) : (
              <Text className="text-2xl font-extrabold text-ink">New chat</Text>
            )}
            {/* onPress (not onPressIn) so a scroll or stray touch cannot close the sheet. */}
            <PressableScale onPress={closePicker} hitSlop={12} accessibilityLabel="Close new chat">
              <Text className="text-2xl text-muted">×</Text>
            </PressableScale>
          </View>
          {loading ? (
            <SkeletonBlock color={theme.surfaceAlt} style={{ height: 48, borderRadius: 16, marginBottom: 12 }} />
          ) : (
            <TextInput
              className="mb-3 h-12 rounded-2xl border border-line bg-surface px-4 text-ink"
              placeholder="Search users..."
              placeholderTextColor={theme.muted}
              value={query}
              onChangeText={onQuery}
              autoFocus
            />
          )}
          {!loading && adminContact ? (
            <TouchableOpacity
              className="mb-3 flex-row items-center rounded-2xl border p-4"
              style={{ backgroundColor: theme.separatorBg, borderColor: theme.primary }}
              onPress={() => onSelect(adminContact)}
              accessibilityLabel="Chat with Admin">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.outgoingBase }}>
                <Text className="font-extrabold" style={{ color: theme.outgoingInk }}>A</Text>
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-ink">Chat with Admin</Text>
                <Text className="mt-1 text-xs text-muted">
                  {adminContact.online ? 'Online' : 'Get help from the Medi team'}
                </Text>
              </View>
              <Text className="text-2xl text-brand">&gt;</Text>
            </TouchableOpacity>
          ) : null}
          {loading ? (
            <View className="py-2">
              {[0, 1, 2, 3].map(index => (
                <View key={index} className="mb-3 flex-row items-center border-b border-line py-3">
                  <SkeletonBlock color={theme.surfaceAlt} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
                  <View className="flex-1">
                    <SkeletonBlock color={theme.surfaceAlt} style={{ width: 128, height: 16, borderRadius: 8, marginBottom: 8 }} />
                    <SkeletonBlock color={theme.surfaceAlt} style={{ width: 96, height: 12, borderRadius: 6 }} />
                  </View>
                  <SkeletonBlock color={theme.surfaceAlt} style={{ width: 20, height: 20, borderRadius: 10 }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={users}
              keyboardShouldPersistTaps="handled"
              keyExtractor={item => String(item.id)}
              renderItem={({ item, index }) => (
                <FadeSlideIn index={index}>
                  <PressableScale
                    className="flex-row items-center border-b border-line py-3"
                    onPress={() => onSelect(item)}
                    accessibilityLabel={`Chat with ${item.name || 'user'}`}>
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.separatorBg }}>
                      <Text className="font-extrabold" style={{ color: theme.primaryLight }}>{initials(item.name)}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <PresenceIndicator
                          online={Boolean(item.online)}
                          theme={theme}
                          size={8}
                          style={{ marginRight: 8 }}
                        />
                        <Text className="font-bold text-ink">{item.name || 'Medi user'}</Text>
                      </View>
                      <Text className="mt-1 text-xs text-muted">
                        {item.online ? 'Online' : item.lastSeenAt ? `Last seen ${new Date(item.lastSeenAt).toLocaleString()}` : item.email || 'Available to chat'}
                      </Text>
                    </View>
                    <Text className="text-2xl text-brand">›</Text>
                  </PressableScale>
                </FadeSlideIn>
              )}
              ListEmptyComponent={
                <Text className="py-10 text-center text-muted">
                  {query ? 'No users found.' : 'No other registered users yet.'}
                </Text>
              }
            />
          )}
          </ReanimatedAnimated.View>
        </ModalBackdrop>
      </GestureHandlerRootView>
    </Modal>
  );
}

export default function ChatScreen({
  token,
  user,
  onError,
  themeMode = 'dark',
  zegoStatus = 'idle',
  onRetryZego,
}) {
  const theme = getChatTheme(themeMode);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [active, setActive] = useState(null);
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pickerUsers, setPickerUsers] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const onErrorRef = useRef(onError);
  const currentUserId = user?.id || user?._id;

  const toggleConversationSelection = useCallback(userId => {
    const id = String(userId);
    setSelectedConversationIds(current => (
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    ));
  }, []);

  const deleteSelectedConversations = useCallback(async deleteForEveryone => {
    setIsDeleting(true);
    const ids = [...selectedConversationIds];
    const succeeded = [];
    const failures = [];

    for (const userId of ids) {
      try {
        if (deleteForEveryone) {
          await deleteConversationForEveryone(userId, token);
        } else {
          await deleteConversation(userId, token);
        }
        succeeded.push(userId);
      } catch (error) {
        failures.push(error);
      }
    }

    if (succeeded.length) {
      const removedIds = new Set(succeeded);
      setConversations(current => current.filter(item => (
        !removedIds.has(String(item.user?.id || item.user?._id))
      )));
      setSelectedConversationIds(current => current.filter(id => !removedIds.has(id)));
      await Promise.all([
        removeCachedConversations(currentUserId, succeeded),
        ...succeeded.map(userId => clearCachedMessages(
          currentUserId,
          conversationKeyFor(currentUserId, userId),
        )),
      ]);
    }

    if (failures.length) {
      onErrorRef.current?.(failures[0]);
      setDeleteDialog({ step: 'error', message: failures[0]?.message || 'Please try again.' });
    } else if (succeeded.length) {
      setDeleteDialog({ step: 'success', count: succeeded.length });
    }
    setIsDeleting(false);
  }, [currentUserId, selectedConversationIds, token]);

  const confirmDeleteSelected = useCallback(() => {
    const count = selectedConversationIds.length;
    if (!count) return;

    setDeleteDialog({ step: 'choose', count });
  }, [selectedConversationIds.length]);

  const refreshConversations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingConversations(true);
    try {
      const value = await getConversations(token);
      const nextConversations = Array.isArray(value) ? value : [];
      setConversations(nextConversations);
      saveCachedConversations(currentUserId, nextConversations);
    } catch (error) {
      onErrorRef.current?.(error);
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUserId, token]);

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
    const socket = createSocket(token);
    let refreshTimer;
    const refreshList = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => refreshConversations(false), 200);
    };
    const updatePresence = event => {
      const id = String(event?.userId || event?.fromUserId || '');
      if (!id) return;
      setPickerUsers(current => current.map(item => (
        String(item.id) === id ? { ...item, online: Boolean(event.online), lastSeenAt: event.lastSeenAt || item.lastSeenAt } : item
      )));
      setConversations(current => current.map(item => (
        String(item.user?.id) === id
          ? { ...item, user: { ...item.user, online: Boolean(event.online), lastSeenAt: event.lastSeenAt || item.user.lastSeenAt } }
          : item
      )));
      setAdminContact(current => current && String(current.id) === id
        ? { ...current, online: Boolean(event.online), lastSeenAt: event.lastSeenAt || current.lastSeenAt }
        : current);
    };
    socket.on('presence:update', updatePresence);
    socket.on('chat:message', refreshList);
    socket.on('chat:conversation-deleted', refreshList);
    socket.on('connect', refreshList);
    return () => {
      clearTimeout(refreshTimer);
      socket.off('presence:update', updatePresence);
      socket.off('chat:message', refreshList);
      socket.off('chat:conversation-deleted', refreshList);
      socket.off('connect', refreshList);
    };
  }, [currentUserId, token, refreshConversations]);

  useEffect(() => {
    let mounted = true;
    setConversations([]);
    setLoadingConversations(true);

    async function hydrateConversations() {
      const cached = await loadCachedConversations(currentUserId);
      if (!mounted) return;
      if (cached.length) {
        setConversations(cached);
        setLoadingConversations(false);
      }
      refreshConversations(false);
    }

    if (currentUserId) hydrateConversations();
    else setLoadingConversations(false);
    return () => { mounted = false; };
  }, [currentUserId, refreshConversations]);

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
      if (selectedConversationIds.length) {
        setSelectedConversationIds([]);
        return true;
      }

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
  }, [active, pickerOpen, refreshConversations, selectedConversationIds.length]);

  if (active) {
    return (
      <PremiumChatScreen
        contact={active}
        token={token}
        user={user}
        themeMode={themeMode}
        zegoStatus={zegoStatus}
        onRetryZego={onRetryZego}
        onError={onError}
        onBack={() => {
          setActive(null);
          refreshConversations();
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-canvas" style={vars({
      '--color-canvas': theme.background, '--color-surface': theme.surface,
      '--color-ink': theme.ink, '--color-muted': theme.muted, '--color-line': theme.line,
    })}>
      {selectedConversationIds.length ? (
        <View className="flex-row items-center justify-between px-6 pb-5 pt-6">
          <TouchableOpacity
            onPress={() => setSelectedConversationIds([])}
            hitSlop={10}
            accessibilityLabel="Cancel conversation selection">
            <Text className="text-3xl text-ink">{'‹'}</Text>
          </TouchableOpacity>
          <Text className="flex-1 px-4 text-xl font-extrabold text-ink">
            {selectedConversationIds.length} selected
          </Text>
          <TouchableOpacity
            onPress={confirmDeleteSelected}
            hitSlop={10}
            accessibilityLabel="Delete selected chats">
            <Text className="text-sm font-extrabold text-danger">Delete</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row items-start justify-between px-6 pb-5 pt-6">
          <View>
            <Text className="text-3xl font-extrabold text-ink">Messages</Text>
            <Text className="mt-2 text-xs text-muted">
              {conversations.filter(item => item.unreadCount > 0).length} unread conversations
            </Text>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.outgoingBase }}
            onPress={() => {
              setQuery('');
              setPickerUsers([]);
              setPickerLoading(true);
              setPickerOpen(true);
            }}
            accessibilityLabel="Start a new chat">
            <Text className="text-3xl font-light" style={{ color: theme.outgoingInk }}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput value={search} onChangeText={setSearch} placeholder="Search conversations..."
        placeholderTextColor={theme.muted} accessibilityLabel="Search conversations"
        className="mx-6 mb-6 h-12 rounded-2xl border border-line bg-surface px-4 text-ink" />
      <Text className="px-6 pb-3 text-xs font-extrabold uppercase tracking-[1.5px] text-muted">
        Recent
      </Text>

      {loadingConversations ? (
        <View className="items-center py-10">
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : conversations.length ? (
        <FlatList
          data={conversations.filter(item => `${item.user?.name || ''} ${item.lastMessage || ''}`.toLowerCase().includes(search.trim().toLowerCase()))}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text className="py-8 text-center text-muted">No matching conversations.</Text>}
          keyExtractor={item => String(item.user.id)}
          renderItem={({ item }) => {
            const conversationUserId = String(item.user?.id || item.user?._id);
            const selected = selectedConversationIds.includes(conversationUserId);
            return (
            <TouchableOpacity
              className="mx-6 mb-3 flex-row items-center rounded-2xl border border-line bg-surface p-4"
              style={selected
                ? { backgroundColor: theme.separatorBg, borderColor: theme.primary, borderWidth: 2 }
                : item.unreadCount > 0
                  ? { backgroundColor: theme.separatorBg, borderColor: theme.primary }
                  : undefined}
              onLongPress={() => toggleConversationSelection(conversationUserId)}
              delayLongPress={300}
              onPress={() => {
                if (selectedConversationIds.length) {
                  toggleConversationSelection(conversationUserId);
                } else {
                  setActive(item.user);
                }
              }}
              accessibilityLabel={selected
                ? `Deselect chat with ${item.user.name || 'user'}`
                : `Open chat with ${item.user.name || 'user'}`}>
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.line }}>
                <Text className="font-extrabold" style={{ color: theme.primaryLight }}>{initials(item.user.name)}</Text>
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
                  {item.unreadCount > 0 ? (
                    <View style={{ backgroundColor: theme.outgoingBase, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 8 }}>
                      <Text style={{ color: theme.outgoingInk, fontSize: 10, fontWeight: '800' }}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {selected ? (
                <View className="items-center justify-center pl-2">
                  <Text className="text-2xl text-brand">{'\u2713'}</Text>
                </View>
              ) : null}
              <View
                className="items-center"
                style={selected ? { display: 'none' } : undefined}>
                <TouchableOpacity
                  style={{ display: 'none' }}
                  onPress={() => Alert.alert('Delete chat?', `Remove this chat with ${item.user.name || 'this user'} from your recent chats?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        await deleteConversation(item.user.id, token);
                        setConversations(current => current.filter(row => String(row.user?.id) !== String(item.user.id)));
                      } catch (error) { onErrorRef.current?.(error); }
                    } },
                  ])}
                  hitSlop={10}
                  accessibilityLabel={`Delete chat with ${item.user.name || 'user'}`}>
                  <Text className="text-xl text-danger">×</Text>
                </TouchableOpacity>
                <Text className="text-2xl text-brand">›</Text>
              </View>
            </TouchableOpacity>
            );
          }}
        />
      ) : (
        <Text className="px-6 py-8 text-center text-muted">No conversations yet.</Text>
      )}

      {!loadingConversations && !conversations.length ? <View className="mx-6 mt-4 rounded-2xl border border-dashed border-line p-5">
        <Text className="text-center text-sm font-bold text-ink">Start a new conversation</Text>
        <Text className="mt-1 text-center text-xs leading-5 text-muted">
          Tap the + button above to choose any registered user.
        </Text>
      </View> : null}

      <SweetAlertModal
        visible={deleteDialog?.step === 'choose'}
        type="warning"
        theme={theme}
        title={`Delete selected chat${deleteDialog?.count === 1 ? '' : 's'}?`}
        message="Choose what you want to remove."
        primaryText="Delete from here"
        secondaryText="Delete all chat"
        onPrimary={() => setDeleteDialog({ step: 'confirm-local' })}
        onSecondary={() => setDeleteDialog({ step: 'confirm-all' })}
        onCancel={() => setDeleteDialog(null)}
      />
      <SweetAlertModal
        visible={deleteDialog?.step === 'confirm-local'}
        type="warning"
        theme={theme}
        title="Delete from here?"
        message="This removes the selected chats only from your account."
        primaryText="Delete"
        onPrimary={() => deleteSelectedConversations(false)}
        onCancel={() => setDeleteDialog(null)}
        loading={isDeleting}
      />
      <SweetAlertModal
        visible={deleteDialog?.step === 'confirm-all'}
        type="danger"
        theme={theme}
        title="Delete entire chat?"
        message="This permanently deletes the selected chat history for both participants. This cannot be undone."
        primaryText="Delete all"
        onPrimary={() => deleteSelectedConversations(true)}
        onCancel={() => setDeleteDialog(null)}
        loading={isDeleting}
      />
      <SweetAlertModal
        visible={deleteDialog?.step === 'success'}
        type="success"
        theme={theme}
        title={`Chat${deleteDialog?.count === 1 ? '' : 's'} deleted`}
        primaryText="Done"
        cancelText={null}
        onPrimary={() => setDeleteDialog(null)}
      />
      <SweetAlertModal
        visible={deleteDialog?.step === 'error'}
        type="danger"
        theme={theme}
        title="Could not delete chat"
        message={deleteDialog?.message}
        primaryText="Close"
        cancelText={null}
        onPrimary={() => setDeleteDialog(null)}
      />

      <UserPicker
        theme={theme}
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
