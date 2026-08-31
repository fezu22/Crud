import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
export default function ProjectDetailModal({
  visible,
  project,
  tasks,
  onClose,
  onTask,
  onAddTask,
}) {
  if (!project) return null;
  const list = tasks.filter(
    t => (t.projectId?._id || t.projectId) === project._id,
  );
  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-canvas">
        <View
          className="rounded-b-[32px] px-5 pb-8 pt-6"
          style={{ backgroundColor: project.color || '#6750E8' }}
        >
          <TouchableOpacity
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white/20"
            onPress={onClose}
          >
            <Text className="text-2xl text-white">‹</Text>
          </TouchableOpacity>
          <Text className="mt-6 text-4xl font-extrabold text-white">
            {project.name}
          </Text>
          <Text className="mt-2 text-sm text-white/80">
            {project.description || 'A focused space for your plans.'}
          </Text>
          <Text className="mt-5 self-start rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white">
            {list.filter(t => t.completed).length}/{list.length} completed
          </Text>
        </View>
        <ScrollView contentContainerClassName="px-5 pb-28 pt-5">
          {list.map(task => (
            <TouchableOpacity
              key={task._id}
              className="mb-3 flex-row items-center rounded-2xl border border-line p-4"
              onPress={() => onTask(task)}
            >
              <View
                className={`mr-3 h-6 w-6 items-center justify-center rounded-lg border-2 ${
                  task.completed ? 'border-brand bg-brand' : 'border-[#c5c0d0]'
                }`}
              >
                {task.completed ? <Text className="text-white">✓</Text> : null}
              </View>
              <View className="flex-1">
                <Text
                  className={`font-bold ${
                    task.completed ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  {task.title}
                </Text>
                <Text className="mt-1 text-xs text-muted">
                  {task.category || 'Personal'} · {task.priority || 'Medium'}{' '}
                  priority
                </Text>
              </View>
              <Text className="text-2xl text-muted">›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-[22px] bg-brand"
          onPress={() => onAddTask(project)}
        >
          <Text className="text-3xl text-white">＋</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
