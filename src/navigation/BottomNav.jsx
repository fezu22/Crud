import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
const tabs = [['home', '⌂', 'Home'], ['chat', '◌', 'Chat'], ['media', '♫', 'Media'], ['profile', '○', 'Profile']];
export default function BottomNav({ active, onChange }) {
  return <View className="h-[72px] flex-row items-center justify-around border-t border-line bg-canvas">{tabs.map(([key, icon, label]) => <TouchableOpacity key={key} className="w-16 items-center" onPress={() => onChange(key)}><Text className={`text-2xl ${active === key ? 'text-brand' : 'text-[#aaa5b5]'}`}>{icon}</Text><Text className={`mt-1 text-[10px] font-semibold ${active === key ? 'text-brand' : 'text-[#aaa5b5]'}`}>{label}</Text></TouchableOpacity>)}</View>;
}
