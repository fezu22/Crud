import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import ModalHeader from '../../components/ModalHeader';
import DraggableSuccessModal from '../../components/DraggableSuccessModal';
import InfiniteCardSlider from '../../components/InfiniteCardSlider';

const ATTACHMENT_WIDTH = Dimensions.get('window').width - 48;

// ==========================================
//  REFINED ANIMATED BACK BUTTON
// ==========================================
const AnimatedBackButton = ({ onPress }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);

  // Mount animation
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateX.value = withSpring(0, { damping: 12, stiffness: 90 });
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.btnWrapper, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.btnTouch}
      >
        <Text style={styles.btnText}>‹</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==========================================
//  MAIN MODAL (unchanged)
// ==========================================
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-canvas relative">
        <AnimatedBackButton onPress={onClose} />

        <View style={{ marginTop: 8 }}>
          <ModalHeader
            title="Task details"
            onClose={onClose}
            onEdit={() => onEdit(task)}
          />
        </View>

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

          {task.description && (
            <Text className="mt-3 text-base leading-6 text-muted">
              {task.description}
            </Text>
          )}

          {task.dueDate && (
            <View className="mt-5 rounded-2xl bg-surface p-4">
              <Text className="text-[10px] font-extrabold tracking-widest text-muted">
                DUE DATE
              </Text>
              <Text className="mt-1 font-bold text-ink">
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {task.reminderAt && (
            <View className="mt-3 rounded-2xl bg-[#eeeaff] p-4">
              <Text className="text-[10px] font-extrabold tracking-widest text-brand">
                REMINDER
              </Text>
              <Text className="mt-1 font-bold text-ink">
                {new Date(task.reminderAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                Notification 2 minutes before
              </Text>
            </View>
          )}

          {images.length > 0 && (
            <>
              <Text className="mb-3 mt-6 text-[10px] font-extrabold tracking-widest text-muted">
                ATTACHMENTS
              </Text>
              <InfiniteCardSlider
                images={images}
                width={ATTACHMENT_WIDTH}
                height={210}
                borderRadius={20}
              />
            </>
          )}

          {task.subtasks?.length > 0 && (
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
                      className={`mr-3 h-6 w-6 items-center justify-center rounded-lg border-2 ${sub.done ? 'border-brand bg-brand' : 'border-[#c5c0d0]'
                        }`}
                    >
                      {sub.done && <Text className="text-white">✓</Text>}
                    </View>
                    <Text
                      className={`font-bold ${sub.done ? 'text-muted line-through' : 'text-ink'
                        }`}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
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

// ==========================================
//  REFINED STYLES
// ==========================================
const styles = StyleSheet.create({
  btnWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.60)', // soft translucent
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  btnTouch: {
    width: 40,
    height: 40,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 28,
    fontWeight: '300', // thinner, more elegant
    color: '#1D1D1F',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: -2,
  },
});