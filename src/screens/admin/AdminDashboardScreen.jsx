import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getConversations } from '../../services/api';
import ChatThread from '../../components/ChatThread';

export default function AdminDashboardScreen({ token, user, onLogout, onError }) {
  const [conversations, setConversations] = useState([]); const [active, setActive] = useState(null);
  const refresh = () => getConversations(token).then(setConversations).catch(onError);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); const id = setInterval(() => { if (!active) refresh(); }, 8000); return () => clearInterval(id); }, [token, active]);
  if (active) return <ChatThread person={active} user={user} token={token} onBack={() => { setActive(null); refresh(); }} onError={onError} />;
  return <View className="flex-1 bg-canvas"><View className="flex-row items-center justify-between border-b border-line px-6 pb-5 pt-6"><View><Text className="text-[10px] font-extrabold tracking-[2px] text-brand">MEDI ADMIN</Text><Text className="mt-1 text-3xl font-extrabold text-ink">Inbox</Text></View><TouchableOpacity onPress={onLogout}><Text className="font-bold text-brand">Log out</Text></TouchableOpacity></View><FlatList className="px-6" data={conversations} keyExtractor={item => item.user.id} renderItem={({ item }) => <TouchableOpacity className="flex-row items-center border-b border-line py-4" onPress={() => setActive(item.user)}><View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#EDE9FE]"><Text className="font-extrabold text-brand">{item.user.name?.[0]?.toUpperCase() || '?'}</Text></View><View className="flex-1"><Text className="font-bold text-ink">{item.user.name}</Text><Text className="text-xs text-muted" numberOfLines={1}>{item.lastMessage}</Text></View>{item.unreadCount > 0 && <View className="ml-2 min-w-[24px] rounded-full bg-brand px-2 py-1"><Text className="text-center text-xs font-bold text-white">{item.unreadCount}</Text></View>}</TouchableOpacity>} ListEmptyComponent={<Text className="py-16 text-center text-muted">Abhi tak koi user ne message nahi kiya.</Text>} /></View>;
}
