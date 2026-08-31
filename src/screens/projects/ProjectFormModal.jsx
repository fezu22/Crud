import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ModalHeader from '../../components/ModalHeader';
import DueDatePicker, {
  formatDueDate,
} from '../../components/DueDatePicker';
const palette = ['#6750E8', '#F08A74', '#47B8A5', '#E0A93A', '#7994E8'];
export default function ProjectFormModal({ visible, saving, onClose, onSave }) {
  const [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [color, setColor] = useState(palette[0]),
    [dueDate, setDueDate] = useState(''),
    [datePickerOpen, setDatePickerOpen] = useState(false);
  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setColor(palette[0]);
      setDueDate('');
    }
  }, [visible]);
  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-canvas">
        <ModalHeader title="New project" onClose={onClose} />
        <ScrollView contentContainerClassName="px-6 pb-28 pt-6">
          <View
            className="h-36 items-center justify-center rounded-3xl"
            style={{ backgroundColor: color }}
          >
            <Text className="text-4xl text-white">✦</Text>
            <Text className="mt-2 text-xl font-extrabold text-white">
              {name || 'Your project'}
            </Text>
          </View>
          <Text className="mb-2 mt-6 text-[10px] font-extrabold tracking-widest text-muted">
            PROJECT NAME
          </Text>
          <TextInput
            className="h-14 rounded-2xl border border-line bg-surface px-4 text-ink"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Home makeover"
            placeholderTextColor="#817C94"
          />
          <Text className="mb-2 mt-5 text-[10px] font-extrabold tracking-widest text-muted">
            DESCRIPTION
          </Text>
          <TextInput
            className="h-28 rounded-2xl border border-line bg-surface px-4 py-4 text-ink"
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text className="mb-2 mt-5 text-[10px] font-extrabold tracking-widest text-muted">
            DUE DATE
          </Text>
          <TouchableOpacity
            className="h-14 flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4"
            onPress={() => setDatePickerOpen(true)}
          >
            <Text
              className={dueDate ? 'text-ink' : 'text-muted'}
              style={!dueDate ? { color: '#817C94' } : undefined}
            >
              {dueDate ? formatDueDate(dueDate) : 'Select a due date'}
            </Text>
            <Text className="text-lg text-muted">📅</Text>
          </TouchableOpacity>
          {dueDate ? (
            <TouchableOpacity
              className="mt-2 self-start"
              onPress={() => setDueDate('')}
            >
              <Text className="text-xs font-bold text-brand">
                Clear due date
              </Text>
            </TouchableOpacity>
          ) : null}
          <Text className="mb-3 mt-5 text-[10px] font-extrabold tracking-widest text-muted">
            COLOR
          </Text>
          <View className="flex-row">
            {palette.map(value => (
              <TouchableOpacity
                key={value}
                className={`mr-3 h-11 w-11 rounded-2xl ${value === color ? 'border-4 border-white' : ''
                  }`}
                style={{ backgroundColor: value }}
                onPress={() => setColor(value)}
              />
            ))}
          </View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-canvas p-4">
          <TouchableOpacity
            className={`h-14 items-center justify-center rounded-2xl bg-brand ${!name.trim() || saving ? 'opacity-40' : ''
              }`}
            disabled={!name.trim() || saving}
            onPress={() =>
              onSave({
                name: name.trim(),
                description: description.trim(),
                color,
                dueDate: dueDate || null,
              })
            }
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-extrabold text-white">Create project</Text>
            )}
          </TouchableOpacity>
        </View>
        <DueDatePicker
          visible={datePickerOpen}
          value={dueDate}
          onClose={() => setDatePickerOpen(false)}
          onSelect={value => {
            setDueDate(value);
            setDatePickerOpen(false);
          }}
        />
      </View>
    </Modal>
  );
}