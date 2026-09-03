import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getConversations } from '../../services/api';
import ChatThread from '../../components/ChatThread';

const UserRow = ({ person, preview, unreadCount, onPress }) => <TouchableOpacity className="flex-row items-center border-b border-line py-4" onPress={onPress}><View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#EDE9FE]"><Text className="font-extrabold text-brand">{person.name?.[0]?.toUpperCase() || '?'}</Text></View><View className="flex-1"><View className="flex-row items-center"><View className={`mr-2 h-2 w-2 rounded-full ${person.online ? 'bg-[#47B8A5]' : 'bg-gray-400'}`} /><Text className="font-bold text-ink">{person.name}</Text></View><Text className="text-xs text-muted" numberOfLines={1}>{preview || person.email}</Text></View>{unreadCount > 0 && <View className="ml-2 min-w-[24px] rounded-full bg-brand px-2 py-1"><Text className="text-center text-xs font-bold text-white">{unreadCount}</Text></View>}</TouchableOpacity>;

export default function AdminDashboardScreen({ token, user, onLogout, onError }) {
  const [conversations, setConversations] = useState([]); const [active, setActive] = useState(null);
  const refresh = () => getConversations(token).then(setConversations).catch(onError);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); const id = setInterval(() => { if (!active) refresh(); }, 8000); return () => clearInterval(id); }, [token, active]);
  if (active) return <ChatThread person={active} user={user} token={token} onBack={() => { setActive(null); refresh(); }} onError={onError} />;
  return <View className="flex-1 bg-canvas"><View className="flex-row items-center justify-between border-b border-line px-6 pb-5 pt-6"><View><Text className="text-[10px] font-extrabold tracking-[2px] text-brand">MEDI ADMIN</Text><Text className="mt-1 text-3xl font-extrabold text-ink">User Chats</Text></View><TouchableOpacity onPress={onLogout}><Text className="font-bold text-brand">Log out</Text></TouchableOpacity></View><FlatList className="px-6" data={conversations} keyExtractor={item => `chat-${item.user.id}`} ListHeaderComponent={<Text className="mt-5 font-extrabold text-ink">Chats</Text>} renderItem={({ item }) => <UserRow person={item.user} preview={item.lastMessage} unreadCount={item.unreadCount} onPress={() => setActive(item.user)} />} ListEmptyComponent={<Text className="py-16 text-center text-muted">Abhi tak koi user ne message nahi kiya.</Text>} /></View>;
}
