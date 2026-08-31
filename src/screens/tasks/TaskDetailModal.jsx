import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ModalHeader from '../../components/ModalHeader';
import DraggableSuccessModal from '../../components/DraggableSuccessModal';
export default function TaskDetailModal({
  visible,
  task,
  onClose,
  onToggle,
  onEdit,
  onDelete,
  onToggleSubtask,
  successNotification,
  onSuccessOk,
}) {
  if (!task) return null;
  const images = task.imageUrls?.length
    ? task.imageUrls
    : task.imageUrl
    ? [task.imageUrl]
    : [];
  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-canvas">
        <ModalHeader
          title="Task details"
          onClose={onClose}
          onEdit={() => onEdit(task)}
        />
        <ScrollView contentContainerClassName="px-6 pb-32 pt-6">
          <View className="flex-row">
            <Text className="mr-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-extrabold text-amber-700">
              {task.priority || 'Medium'} priority
            </Text>
            <Text className="rounded-xl bg-[#eae5ff] px-3 py-2 text-xs font-extrabold text-brand">
              {task.category || 'Personal'}
            </Text>
          </View>
          <Text className="mt-5 text-3xl font-extrabold leading-10 text-ink">
            {task.title}
          </Text>
          {task.description ? (
            <Text className="mt-3 text-base leading-6 text-muted">
              {task.description}
            </Text>
          ) : null}
          {task.dueDate ? (
            <View className="mt-5 rounded-2xl bg-surface p-4">
              <Text className="text-[10px] font-extrabold tracking-widest text-muted">
                DUE DATE
              </Text>
              <Text className="mt-1 font-bold text-ink">
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
          {images.length ? (
            <>
              <Text className="mb-3 mt-6 text-[10px] font-extrabold tracking-widest text-muted">
                ATTACHMENTS
              </Text>
              <ScrollView horizontal>
                {images.map((uri, index) => (
                  <Image
                    key={uri + index}
                    source={{ uri }}
                    className="mr-3 h-36 w-52 rounded-2xl"
                  />
                ))}
              </ScrollView>
            </>
          ) : null}
          {task.subtasks?.length ? (
            <>
              <Text className="mb-3 mt-6 text-[10px] font-extrabold tracking-widest text-muted">
                SUBTASKS
              </Text>
              <View className="overflow-hidden rounded-2xl border border-line">
                {task.subtasks.map((sub, index) => (
                  <TouchableOpacity
                    key={sub.label + index}
                    className="flex-row items-center border-b border-line p-4"
                    onPress={() => onToggleSubtask(task, index)}
                  >
                    <View
                      className={`mr-3 h-6 w-6 items-center justify-center rounded-lg border-2 ${
                        sub.done ? 'border-brand bg-brand' : 'border-[#c5c0d0]'
                      }`}
                    >
                      {sub.done ? <Text className="text-white">✓</Text> : null}
                    </View>
                    <Text
                      className={`font-bold ${
                        sub.done ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 flex-row border-t border-line bg-canvas p-4">
          <TouchableOpacity
            className="mr-3 h-14 items-center justify-center rounded-2xl bg-red-50 px-6"
            onPress={() => onDelete(task._id)}
          >
            <Text className="font-extrabold text-red-500">Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="h-14 flex-1 items-center justify-center rounded-2xl bg-brand"
            onPress={() => onToggle(task)}
          >
            <Text className="font-extrabold text-white">
              {task.completed ? 'Mark as open' : 'Complete task'}
            </Text>
          </TouchableOpacity>
        </View>

        <DraggableSuccessModal
          visible={successNotification?.visible}
          message={successNotification?.message}
          onClose={onSuccessOk}
        />
      </View>
    </Modal>
  );
}
