import { useMemo, useState } from 'react';
import {
  createTask,
  deleteMediaByUrl,
  deleteTask,
  updateTask,
  uploadMedia,
} from '../services/api';

function generateBatchId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function useTasks({
  token,
  ask,
  showError,
  showSuccess,
  setMedia,
  onTaskSaved,
  onTaskCompleted,
  onTaskDeleted,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formProject, setFormProject] = useState(null);
  const [savingTask, setSavingTask] = useState(false);

  const editingTask = useMemo(
    () => tasks.find(task => task._id === editingTaskId) || null,
    [editingTaskId, tasks],
  );

  function closeTaskForm() {
    setTaskFormOpen(false);
    setEditingTaskId(null);
    setFormProject(null);
  }

  function resetTasks() {
    setTasks([]);
    setSelectedTask(null);
    closeTaskForm();
  }

  function openTaskForm(task = null, project = null) {
    setEditingTaskId(task?._id || null);
    setFormProject(project);
    setTaskFormOpen(true);
  }

  function replaceTask(updated) {
    setTasks(items =>
      items.map(item => (item._id === updated._id ? updated : item)),
    );
    setSelectedTask(current =>
      current?._id === updated._id ? updated : current,
    );
  }

  async function saveTask(form) {
    setSavingTask(true);
    const isEditing = Boolean(editingTaskId);
    try {
      const batchId = generateBatchId();
      const uploaded = await Promise.all(
        (form.newImages || []).map(image =>
          uploadMedia(image, form.title, token, 'taskAttachment', batchId),
        ),
      );
      const imageUrls = [
        ...(form.imageUrls || []),
        ...uploaded.map(item => item.imageUrl).filter(Boolean),
      ];
      const payload = { ...form, imageUrls, imageUrl: imageUrls[0] || '' };
      delete payload.newImages;

      const saved = isEditing
        ? await updateTask(editingTaskId, payload, token)
        : await createTask(payload, token);

      if (isEditing) {
        replaceTask(saved);
      } else {
        setTasks(items => [saved, ...items]);
      }
      await onTaskSaved?.(saved);
      closeTaskForm();
      showSuccess(
        isEditing ? 'Task has been edited' : 'Task has been created',
        isEditing ? 'taskDetail' : 'screen',
      );
    } catch (error) {
      showError('Could not save task', error);
    } finally {
      setSavingTask(false);
    }
  }

  async function toggleTask(task) {
    try {
      const isCompleting = !task.completed;
      const updated = await updateTask(
        task._id,
        { completed: isCompleting },
        token,
      );
      replaceTask(updated);
      if (isCompleting) {
        await onTaskCompleted?.(task._id);
        showSuccess('Task completed!', 'taskDetail');
      } else {
        showSuccess('Task marked as open', 'taskDetail');
      }
    } catch (error) {
      showError('Could not update task', error);
    }
  }

  async function toggleSubtask(task, index) {
    if (!task?._id || !Number.isInteger(index)) return;
    try {
      const subtasks = (task.subtasks || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, done: !item.done } : item,
      );
      const updated = await updateTask(task._id, { subtasks }, token);
      replaceTask(updated);
    } catch (error) {
      showError('Could not update subtask', error);
    }
  }

  function removeTask(taskId) {
    ask({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTask(taskId, token);
          await onTaskDeleted?.(taskId);
          setTasks(items => items.filter(item => item._id !== taskId));
          setSelectedTask(null);
          showSuccess('Task has been deleted');
        } catch (error) {
          showError('Could not delete task', error);
        }
      },
    });
  }

  async function removeTaskImage(imageUrl) {
    try {
      await deleteMediaByUrl(imageUrl, token);
      setMedia(items => items.filter(item => item.imageUrl !== imageUrl));
      setTasks(items =>
        items.map(task => removeImageFromTask(task, imageUrl)),
      );
      setSelectedTask(current =>
        current ? removeImageFromTask(current, imageUrl) : current,
      );
      return true;
    } catch (error) {
      showError('Could not delete image', error);
      return false;
    }
  }

  return {
    tasks,
    setTasks,
    selectedTask,
    setSelectedTask,
    taskFormOpen,
    editingTask,
    formProject,
    savingTask,
    resetTasks,
    openTaskForm,
    closeTaskForm,
    saveTask,
    toggleTask,
    toggleSubtask,
    removeTask,
    removeTaskImage,
  };
}

function removeImageFromTask(task, imageUrl) {
  const imageUrls = (task.imageUrls || []).filter(url => url !== imageUrl);
  return {
    ...task,
    imageUrls,
    imageUrl:
      task.imageUrl === imageUrl ? imageUrls[0] || '' : task.imageUrl,
  };
}
