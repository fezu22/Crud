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
const values = {
  priority: ['Low', 'Medium', 'High'],
  category: ['Personal', 'Work', 'Health', 'Shopping'],
};
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
    className={`mr-2 rounded-xl border px-4 py-2.5 ${
      active ? 'border-brand bg-brand' : 'border-line bg-canvas'
    }`}
    onPress={onPress}
  >
    <Text
      className={`text-xs font-bold ${active ? 'text-white' : 'text-muted'}`}
    >
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
}) {
  const [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [priority, setPriority] = useState('Medium'),
    [category, setCategory] = useState('Personal'),
    [projectId, setProjectId] = useState(''),
    [dueDate, setDueDate] = useState(''),
    [sub, setSub] = useState(''),
    [subtasks, setSubtasks] = useState([]),
    [images, setImages] = useState([]);
  useEffect(() => {
    if (visible) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setPriority(task?.priority || 'Medium');
      setCategory(task?.category || 'Personal');
      setProjectId(
        task?.projectId?._id || task?.projectId || project?._id || '',
      );
      setDueDate(
        task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      );
      setSubtasks(task?.subtasks || []);
      setImages([]);
    }
  }, [visible, task, project]);
  const old = task?.imageUrls?.length
    ? task.imageUrls
    : task?.imageUrl
    ? [task.imageUrl]
    : [];
  const pick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 8,
    });
    if (result.assets)
      setImages(current =>
        [...current, ...result.assets.filter(a => a.uri)].slice(0, 8),
      );
  };
  const addSubtask = () => {
    if (sub.trim()) {
      setSubtasks(current => [...current, { label: sub.trim(), done: false }]);
      setSub('');
    }
  };
  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-canvas">
        <ModalHeader
          title={task ? 'Edit task' : 'New task'}
          onClose={onClose}
        />
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
            <ScrollView horizontal>
              {projects.map(p => (
                <Choice
                  key={p._id}
                  label={p.name}
                  active={projectId === p._id}
                  onPress={() => setProjectId(p._id)}
                />
              ))}
            </ScrollView>
          </Field>
          <Field label="PRIORITY">
            <View className="flex-row">
              {values.priority.map(v => (
                <Choice
                  key={v}
                  label={v}
                  active={priority === v}
                  onPress={() => setPriority(v)}
                />
              ))}
            </View>
          </Field>
          <Field label="CATEGORY">
            <ScrollView horizontal>
              {values.category.map(v => (
                <Choice
                  key={v}
                  label={v}
                  active={category === v}
                  onPress={() => setCategory(v)}
                />
              ))}
            </ScrollView>
          </Field>
          <Field label="DUE DATE">
            <TextInput
              className="h-14 rounded-2xl border border-line bg-surface px-4 text-ink"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#817C94"
            />
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
              <View
                key={item.label + index}
                className="mt-2 flex-row rounded-xl bg-surface p-3"
              >
                <Text className="flex-1 text-ink">{item.label}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setSubtasks(current =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
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
              <Text className="mt-1 font-extrabold text-ink">
                Choose multiple photos
              </Text>
              <Text className="text-xs text-muted">Up to 8 images</Text>
            </TouchableOpacity>
            {old.length + images.length > 0 ? (
              <View className="mt-3 rounded-2xl bg-surface p-3">
                <Text className="mb-2 text-xs font-bold text-muted">
                  {old.length + images.length} photos in this task
                </Text>
                <View className="flex-row flex-wrap">
                  {[...old, ...images.map(item => item.uri)].map(
                    (uri, index) => (
                      <Image
                        key={uri + index}
                        source={{ uri }}
                        className="mb-2 mr-2 h-24 w-28 rounded-xl"
                      />
                    ),
                  )}
                </View>
              </View>
            ) : null}
          </Field>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-canvas p-4">
          <TouchableOpacity
            className={`h-14 items-center justify-center rounded-2xl bg-brand ${
              !title.trim() || saving ? 'opacity-40' : ''
            }`}
            disabled={!title.trim() || saving}
            onPress={() =>
              onSave({
                title: title.trim(),
                description: description.trim(),
                priority,
                category,
                projectId: projectId || null,
                dueDate: dueDate || null,
                subtasks,
                newImages: images,
                imageUrls: old,
              })
            }
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-extrabold text-white">
                {task ? 'Save changes' : 'Create task'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
