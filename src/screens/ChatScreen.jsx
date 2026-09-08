import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getChatUsers, getConversations } from '../services/api';
import PremiumChatScreen from './chat/PremiumChatScreen';

function initials(name) {
  return String(name || 'User')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function UserPicker({ visible, users, query, loading, onQuery, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[86%] rounded-t-[28px] bg-canvas px-5 pb-7 pt-3">
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-extrabold text-ink">New chat</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close new chat">
              <Text className="text-2xl text-muted">×</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="mb-3 h-12 rounded-2xl border border-line bg-surface px-4 text-ink"
            placeholder="Search users..."
            placeholderTextColor="#817C94"
            value={query}
            onChangeText={onQuery}
            autoFocus
          />
          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#6C4DF6" />
            </View>
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
                        className={`mr-2 h-2 w-2 rounded-full ${item.online ? 'bg-[#47B8A5]' : 'bg-gray-400'}`}
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
        </View>
      </View>
    </Modal>
  );
}

export default function ChatScreen({ token, user, onError }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const onErrorRef = useRef(onError);

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
    refreshConversations();
    return undefined;
  }, [refreshConversations]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    let mounted = true;
    setLoadingUsers(true);
    getChatUsers(token, query)
      .then(value => {
        if (mounted) setUsers(Array.isArray(value) ? value : []);
      })
      .catch(error => onErrorRef.current?.(error))
      .finally(() => {
        if (mounted) setLoadingUsers(false);
      });
    return () => {
      mounted = false;
    };
  }, [pickerOpen, query, token]);

  if (active) {
    return (
      <PremiumChatScreen
        contact={active}
        token={token}
        user={user}
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
                <Text className="font-extrabold text-ink">{item.user.name || 'Medi user'}</Text>
                <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{item.lastMessage}</Text>
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
        users={users}
        query={query}
        loading={loadingUsers}
        onQuery={setQuery}
        onClose={() => setPickerOpen(false)}
        onSelect={contact => {
          setPickerOpen(false);
          setActive(contact);
        }}
      />
    </View>
  );
}
