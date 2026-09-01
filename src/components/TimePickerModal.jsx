import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CenteredModal from './CenteredModal';
import { formatTaskTime } from '../utils/taskReminder';

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function TimeOptions({ label, options, selected, onSelect }) {
  return (
    <>
      <Text className="mb-2 mt-4 text-[10px] font-extrabold tracking-widest text-muted">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map(item => (
          <TouchableOpacity
            key={item}
            className={`mr-2 h-12 w-12 items-center justify-center rounded-xl border ${selected === item ? 'border-brand bg-brand' : 'border-line bg-surface'}`}
            onPress={() => onSelect(item)}
          >
            <Text className={`font-extrabold ${selected === item ? 'text-white' : 'text-ink'}`}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

export default function TimePickerModal({ visible, value, onClose, onSelect }) {
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (!visible) return;
    const valid = /^\d{2}:\d{2}$/.test(value || '') ? value : '09:00';
    const [nextHour, nextMinute] = valid.split(':');
    setHour(nextHour);
    setMinute(String(Math.floor(Number(nextMinute) / 5) * 5).padStart(2, '0'));
  }, [value, visible]);

  return (
    <CenteredModal visible={visible} onClose={onClose}>
      <View className="bg-canvas px-6 pb-7 pt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-extrabold text-ink">Select time</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="font-bold text-muted">Cancel</Text>
          </TouchableOpacity>
        </View>
        <TimeOptions label="HOUR" options={HOURS} selected={hour} onSelect={setHour} />
        <TimeOptions label="MINUTE" options={MINUTES} selected={minute} onSelect={setMinute} />
        <TouchableOpacity
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-brand"
          onPress={() => onSelect(`${hour}:${minute}`)}
        >
          <Text className="font-extrabold text-white">Use {formatTaskTime(`${hour}:${minute}`)}</Text>
        </TouchableOpacity>
      </View>
    </CenteredModal>
  );
}
