import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import ModalHeader from '../../components/ModalHeader';
import DueDatePicker, { formatDueDate } from '../../components/DueDatePicker';

const values = {
  priority: ['Low', 'Medium', 'High'],
  category: ['Personal', 'Work', 'Health', 'Shopping'],
};

const durationOptions = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: 'Custom', value: 'custom' },
];

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const Field = ({ label, children }) => (
  <View>
    <Text className="mb-2 mt-5 text-[10px] font-extrabold tracking-widest text-muted">
      {label}
    </Text>
    {children}
  </View>
);

const Choice = ({ label, active, onPress }) => (
  <TouchableOpacity
    className={`mr-2 rounded-xl border px-4 py-2.5 ${active ? 'border-brand bg-brand' : 'border-line bg-canvas'}`}
    onPress={onPress}
  >
    <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-muted'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function TaskFormModal({
  visible,
  task,
  project,
  projects,
  saving,
  onClose,
  onSave,
  onDeleteImage,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Personal');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [sub, setSub] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletingUrl, setDeletingUrl] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setPriority(task?.priority || 'Medium');
      setCategory(task?.category || 'Personal');
      setProjectId(task?.projectId?._id || task?.projectId || project?._id || '');
      setDueDate(
        task?.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 10)
          : task ? '' : getTodayString()
      );
      const saved = task?.durationMinutes || 30;
      setDuration([5, 10, 15, 30, 60, 120].includes(saved) ? saved : 'custom');
      setCustomDuration([5, 10, 15, 30, 60, 120].includes(saved) ? '' : String(saved));
      setSubtasks(task?.subtasks || []);
      setExistingImages(task?.imageUrls?.length ? task.imageUrls : task?.imageUrl ? [task.imageUrl] : []);
      setImages([]);
      setDeletingUrl('');
    }
  }, [visible, task, project]);

  const finalDuration = duration === 'custom' ? Math.max(1, parseInt(customDuration, 10) || 1) : duration;

  const pick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 8 });
    if (result.assets) setImages(curr => [...curr, ...result.assets.filter(a => a.uri)].slice(0, 8));
  };

  const addSubtask = () => {
    if (sub.trim()) {
      setSubtasks(curr => [...curr, { label: sub.trim(), done: false }]);
      setSub('');
    }
  };

  const removeExistingImage = async (uri) => {
    if (deletingUrl) return;
    setDeletingUrl(uri);
    try {
      const deleted = await onDeleteImage(uri);
      if (deleted) setExistingImages(curr => curr.filter(v => v !== uri));
    } finally {
      setDeletingUrl('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-canvas">
        <ModalHeader title={task ? 'Edit task' : 'New task'} onClose={onClose} />
        <ScrollView contentContainerClassName="px-6 pb-32">
          <Field label="TITLE">
            <TextInput
              className="h-14 rounded-2xl border border-line bg-surface px-4 text-ink"
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor="#817C94"
            />
          </Field>

          <Field label="DESCRIPTION">
            <TextInput
              className="h-28 rounded-2xl border border-line bg-surface px-4 py-4 text-ink"
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </Field>

          <Field label="PROJECT">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {projects.map(p => (
                <Choice key={p._id} label={p.name} active={projectId === p._id} onPress={() => setProjectId(p._id)} />
              ))}
            </ScrollView>
          </Field>

          <Field label="PRIORITY">
            <View className="flex-row">
              {values.priority.map(v => (
                <Choice key={v} label={v} active={priority === v} onPress={() => setPriority(v)} />
              ))}
            </View>
          </Field>

          <Field label="CATEGORY">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {values.category.map(v => (
                <Choice key={v} label={v} active={category === v} onPress={() => setCategory(v)} />
              ))}
            </ScrollView>
          </Field>

          <Field label="DURATION (for reminders)">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {durationOptions.map(opt => (
                <Choice
                  key={opt.value}
                  label={opt.label}
                  active={duration === opt.value}
                  onPress={() => {
                    setDuration(opt.value);
                    if (opt.value !== 'custom') setCustomDuration('');
                  }}
                />
              ))}
            </ScrollView>

            {duration === 'custom' && (
              <View className="mt-3 h-14 flex-row items-center rounded-2xl border border-line bg-surface px-4">
                <TextInput
                  className="flex-1 text-ink"
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholder="Enter minutes"
                  placeholderTextColor="#817C94"
                  keyboardType="number-pad"
                />
                <Text className="text-sm font-bold text-muted">min</Text>
              </View>
            )}

            <Text className="mt-2 text-xs text-muted">
              Selected: {finalDuration} min {'\u2192'} reminder after {finalDuration} min
            </Text>
          </Field>

          <Field label="DUE DATE">
            <TouchableOpacity
              className="h-14 flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4"
              onPress={() => setDatePickerOpen(true)}
            >
              <Text style={!dueDate ? { color: '#817C94' } : undefined} className={dueDate ? 'text-ink' : ''}>
                {dueDate ? formatDueDate(dueDate) : 'Select a due date'}
              </Text>
              <Text className="text-lg text-muted">📅</Text>
            </TouchableOpacity>
            {dueDate ? (
              <TouchableOpacity className="mt-2 self-start" onPress={() => setDueDate('')}>
                <Text className="text-xs font-bold text-brand">Clear due date</Text>
              </TouchableOpacity>
            ) : null}
          </Field>

          <Field label="SUBTASKS">
            <View className="h-14 flex-row items-center rounded-2xl border border-line px-4">
              <TextInput
                className="flex-1 text-ink"
                value={sub}
                onChangeText={setSub}
                onSubmitEditing={addSubtask}
                placeholder="Add a smaller step"
              />
              <TouchableOpacity onPress={addSubtask}>
                <Text className="text-2xl text-brand">＋</Text>
              </TouchableOpacity>
            </View>
            {subtasks.map((item, index) => (
              <View key={item.label + index} className="mt-2 flex-row rounded-xl bg-surface p-3">
                <Text className="flex-1 text-ink">{item.label}</Text>
                <TouchableOpacity onPress={() => setSubtasks(curr => curr.filter((_, i) => i !== index))}>
                  <Text className="text-red-500">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Field>

          <Field label="PHOTOS">
            <TouchableOpacity
              className="h-28 items-center justify-center rounded-2xl border border-dashed border-[#bdb6d2] bg-surface"
              onPress={pick}
            >
              <Text className="text-2xl text-brand">▧</Text>
              <Text className="mt-1 font-extrabold text-ink">Choose multiple photos</Text>
              <Text className="text-xs text-muted">Up to 8 images</Text>
            </TouchableOpacity>
            {(existingImages.length + images.length) > 0 && (
              <View className="mt-3 rounded-2xl bg-surface p-3">
                <Text className="mb-2 text-xs font-bold text-muted">
                  {existingImages.length + images.length} photos
                </Text>
                <View className="flex-row flex-wrap">
                  {existingImages.map((uri, index) => (
                    <View key={uri + index} className="relative">
                      <Image source={{ uri }} className="mb-2 mr-2 h-24 w-28 rounded-xl" />
                      <TouchableOpacity
                        disabled={!!deletingUrl}
                        className="absolute right-3 top-1 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                        onPress={() => removeExistingImage(uri)}
                      >
                        {deletingUrl === uri ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="font-extrabold text-white">×</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.map((item, index) => (
                    <View key={(item.uri || '') + index} className="relative">
                      <Image source={{ uri: item.uri }} className="mb-2 mr-2 h-24 w-28 rounded-xl" />
                      <TouchableOpacity
                        className="absolute right-3 top-1 h-7 w-7 items-center justify-center rounded-full bg-red-500"
                        onPress={() => setImages(curr => curr.filter((_, i) => i !== index))}
                      >
                        <Text className="font-extrabold text-white">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Field>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-canvas p-4">
          <TouchableOpacity
            className={`h-14 items-center justify-center rounded-2xl bg-brand ${!title.trim() || saving ? 'opacity-40' : ''}`}
            disabled={!title.trim() || saving}
            onPress={() =>
              onSave({
                title: title.trim(),
                description: description.trim(),
                priority,
                category,
                projectId: projectId || null,
                dueDate: dueDate || null,
                durationMinutes: finalDuration,
                subtasks,
                newImages: images,
                imageUrls: existingImages,
              })
            }
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-extrabold text-white">{task ? 'Save changes' : 'Create task'}</Text>
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