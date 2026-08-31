import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatTaskTime } from '../utils/taskReminder';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

export default function TimePickerModal({ visible, value, onClose, onSelect }) {
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (!visible) return;
    const valid = /^\d{2}:\d{2}$/.test(value || '') ? value : '09:00';
    const [nextHour, nextMinute] = valid.split(':');
    const roundedMinute = String(Math.floor(Number(nextMinute) / 5) * 5).padStart(2, '0');
    setHour(nextHour);
    setMinute(roundedMinute);
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-[28px] bg-canvas px-6 pb-8 pt-4" onPress={() => {}}>
          <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-line" />
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-ink">Select time</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="font-bold text-muted">Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text className="mb-2 text-[10px] font-extrabold tracking-widest text-muted">HOUR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hours.map(item => (
              <TouchableOpacity
                key={item}
                className={`mr-2 h-12 w-12 items-center justify-center rounded-xl border ${hour === item ? 'border-brand bg-brand' : 'border-line bg-surface'}`}
                onPress={() => setHour(item)}
              >
                <Text className={`font-extrabold ${hour === item ? 'text-white' : 'text-ink'}`}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text className="mb-2 mt-5 text-[10px] font-extrabold tracking-widest text-muted">MINUTE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {minutes.map(item => (
              <TouchableOpacity
                key={item}
                className={`mr-2 h-12 w-12 items-center justify-center rounded-xl border ${minute === item ? 'border-brand bg-brand' : 'border-line bg-surface'}`}
                onPress={() => setMinute(item)}
              >
                <Text className={`font-extrabold ${minute === item ? 'text-white' : 'text-ink'}`}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            className="mt-6 h-14 items-center justify-center rounded-2xl bg-brand"
            onPress={() => onSelect(`${hour}:${minute}`)}
          >
            <Text className="font-extrabold text-white">Use {formatTaskTime(`${hour}:${minute}`)}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
