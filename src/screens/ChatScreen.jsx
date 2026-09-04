import React, { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAdminChat, getChatUsers } from '../services/api';
import ChatThread from '../components/ChatThread';
import PremiumChatScreen from './chat/PremiumChatScreen';
import { drAhmadContact } from './chat/mockChatData';

export default function ChatScreen({ token, user, onError }) {
  const [users, setUsers] = useState([]); const [query, setQuery] = useState(''); const [active, setActive] = useState(null);
  // onError is an inline parent callback; it must not trigger a refetch loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getChatUsers(token, query).then(setUsers).catch(onError); }, [query, token]);
  async function openAdmin() { try { setActive(await getAdminChat(token)); } catch (e) { onError(e); } }
  if (active?.premium) return <PremiumChatScreen contact={active} onBack={() => setActive(null)} />;
  if (active) return <ChatThread person={active} user={user} token={token} onBack={() => setActive(null)} onError={onError} />;
  return <View className="flex-1 bg-canvas"><View className="px-6 pb-5 pt-6"><Text className="text-[10px] font-extrabold tracking-[2px] text-brand">CONNECT WITH YOUR COMMUNITY</Text><Text className="mt-1 text-4xl font-extrabold text-ink">Chat</Text></View><TouchableOpacity className="mx-6 mb-4 rounded-2xl bg-brand p-4" onPress={() => setActive(drAhmadContact)}><Text className="font-extrabold text-white">Consult with Dr. Ahmad</Text><Text className="mt-1 text-xs text-[#e7e1ff]">Premium demo chat with calls and media</Text></TouchableOpacity><TouchableOpacity className="mx-6 mb-4 rounded-2xl bg-brand p-4" onPress={openAdmin}><Text className="font-extrabold text-white">Chat with Admin</Text><Text className="mt-1 text-xs text-[#e7e1ff]">Get help from the Medi team</Text></TouchableOpacity><TextInput className="mx-6 h-14 rounded-2xl border border-line bg-surface px-4 text-ink" placeholder="Search users to chat..." placeholderTextColor="#817C94" value={query} onChangeText={setQuery} /><FlatList className="mt-4 px-6" data={users} keyExtractor={item => item.id} renderItem={({ item }) => <TouchableOpacity className="flex-row items-center border-b border-line py-4" onPress={() => setActive(item)}><View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#EDE9FE]"><Text className="font-extrabold text-brand">{item.name?.[0]?.toUpperCase() || '?'}</Text></View><View className="flex-1"><View className="flex-row items-center"><View className={`mr-2 h-2 w-2 rounded-full ${item.online ? 'bg-[#47B8A5]' : 'bg-gray-400'}`} /><Text className="font-bold text-ink">{item.name || 'Medi user'}</Text></View><Text className="text-xs text-muted">{item.email || 'Available to chat'}</Text></View><Text className="ml-auto text-xl text-brand">›</Text></TouchableOpacity>} ListEmptyComponent={<Text className="py-10 text-center text-muted">No other users found yet.</Text>} /></View>;
}
