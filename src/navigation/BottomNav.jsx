import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const tabs = [
  ['home', '⌂', 'Home'],
  ['projects', '▦', 'Projects'],
  ['profile', '○', 'Profile'],
];
export default function BottomNav({ active, onChange, onAdd }) {
  const tab = ([key, icon, label]) => (
    <TouchableOpacity
      key={key}
      className="w-16 items-center"
      onPress={() => onChange(key)}
    >
      <Text
        className={`text-2xl ${
          active === key ? 'text-brand' : 'text-[#aaa5b5]'
        }`}
      >
        {icon}
      </Text>
      <Text
        className={`text-[10px] font-semibold ${
          active === key ? 'text-brand' : 'text-[#aaa5b5]'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View className="relative h-[72px] flex-row items-center justify-around border-t border-line bg-canvas">
      {tab(tabs[0])}
      {tab(tabs[1])}
      <View className="w-16" />
      {tab(tabs[2])}
      <TouchableOpacity
        className="absolute bottom-3 left-1/2 -ml-[29px] h-[58px] w-[58px] items-center justify-center rounded-[20px] bg-brand shadow-lg"
        onPress={onAdd}
      >
        <Text className="text-3xl font-light text-white">＋</Text>
      </TouchableOpacity>
    </View>
  );
}
