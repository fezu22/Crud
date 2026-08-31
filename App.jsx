import React, { useEffect, useMemo, useState } from 'react';
import './global.css';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  AlertNotificationRoot,
  ALERT_TYPE,
  Dialog,
} from 'react-native-alert-notification';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ConfirmDialog from './src/components/ConfirmDialog';
import {
  loadSession,
  saveSession,
  clearSession,
} from './src/storage/sessionStorage';
import BottomNav from './src/navigation/BottomNav';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import ProjectsScreen from './src/screens/projects/ProjectsScreen';
import ProjectDetailModal from './src/screens/projects/ProjectDetailModal';
import ProjectFormModal from './src/screens/projects/ProjectFormModal';
import TaskDetailModal from './src/screens/tasks/TaskDetailModal';
import TaskFormModal from './src/screens/tasks/TaskFormModal';
import usePreferences from './src/hooks/usePreferences';
import { appThemes } from './src/theme/appTheme';
import { showDueTaskReminder } from './src/services/notifications';
import {
  registerUser,
  loginUser,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  uploadMedia,
  getMyMedia,
  deleteMedia,
  getProjects,
  createProject,
} from './src/services/api';

function generateBatchId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const emptyConfirm = {
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDestructive: false,
  onConfirm: null,
};

function localDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const preferences = usePreferences();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [media, setMedia] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formProject, setFormProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(emptyConfirm);

  useEffect(() => {
    restoreSession();
  }, []);
  useEffect(() => {
    if (token) loadWorkspace(token);
    else resetWorkspace();
    // Workspace reloads only when the authenticated session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (preferences.ready) {
      showDueTaskReminder(tasks, preferences.notifications);
    }
  }, [tasks, preferences.notifications, preferences.ready]);

  async function restoreSession() {
    try {
      const session = await loadSession();
      if (session.token) {
        setToken(session.token);
        setUser(session.user);
      }
    } catch (error) {
      console.warn('Failed to load session:', error);
    }
  }

  function resetWorkspace() {
    setTasks([]);
    setMedia([]);
    setProjects([]);
    setSelectedTask(null);
    setSelectedProject(null);
    setActiveTab('home');
  }
  function showError(title, error) {
    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title,
      textBody: error.message,
      button: 'OK',
    });
  }
  function ask(config) {
    setConfirm({ ...emptyConfirm, ...config, visible: true });
  }
  function closeConfirm() {
    setConfirm(current => ({ ...current, visible: false, onConfirm: null }));
  }

  async function loadWorkspace(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [taskData, mediaData, projectData] = await Promise.all([
        getTasks(authToken).catch(() => []),
        getMyMedia(authToken).catch(() => []),
        getProjects(authToken).catch(() => []),
      ]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTasks(taskData || []);
      setMedia(mediaData || []);
      setProjects(projectData || []);
    } catch (error) {
      showError('Could not load workspace', error);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadWorkspace();
    setRefreshing(false);
  }
  async function login(credentials) {
    Keyboard.dismiss();
    setAuthLoading(true);
    try {
      const data = await loginUser(
        credentials.identifier,
        credentials.password,
      );
      setToken(data.token);
      setUser(data.user);
      await saveSession(data.token, data.user);
    } catch (error) {
      showError('Sign In Failed', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }
  async function register(form) {
    const identifier = form.email || form.phone;
    const data = await registerUser(form.name, identifier, form.password);
    setToken(data.token);
    setUser(data.user);
    await saveSession(data.token, data.user);
  }
  function logout() {
    ask({
      title: 'Log Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      isDestructive: true,
      onConfirm: async () => {
        setToken(null);
        setUser(null);
        resetWorkspace();
        await clearSession();
      },
    });
  }

  const feedItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayKey = localDateKey(new Date());
    const taskItems = tasks
      .filter(task => {
        const matchesSearch =
          !query ||
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query);
        const dueKey = localDateKey(task.dueDate);
        const matchesFilter =
          filter === 'All' ||
          (filter === 'Today' &&
            dueKey === todayKey &&
            !task.completed) ||
          (filter === 'Upcoming' &&
            dueKey &&
            dueKey > todayKey &&
            !task.completed) ||
          (filter === 'Completed' && task.completed);
        return matchesSearch && matchesFilter;
      })
      .map(task => ({
        ...task,
        feedType: 'task',
        feedDate: task.createdAt || task.updatedAt,
      }));
    const taskImageUrls = new Set(
      tasks.flatMap(task =>
        task.imageUrls?.length
          ? task.imageUrls
          : task.imageUrl
            ? [task.imageUrl]
            : [],
      ),
    );
    const standaloneMedia = media.filter(
      item =>
        filter === 'All' &&
        item.kind !== 'taskAttachment' &&
        !taskImageUrls.has(item.imageUrl) &&
        (!query || item.title?.toLowerCase().includes(query)),
    );
    // Group images that were uploaded together (same batchId) into a single
    // feed card, so "3 photos picked at once" show as one card with all 3
    // images and one caption, instead of 3 separate duplicate cards.
    const batched = new Map();
    const singles = [];
    standaloneMedia.forEach(item => {
      if (item.batchId) {
        if (!batched.has(item.batchId)) batched.set(item.batchId, []);
        batched.get(item.batchId).push(item);
      } else {
        singles.push(item);
      }
    });
    const mediaItems = [
      ...Array.from(batched.values()).map(group => {
        const sorted = [...group].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
        const first = sorted[0];
        return {
          ...first,
          _id: first.batchId,
          mediaIds: sorted.map(entry => entry._id),
          imageUrls: sorted.map(entry => entry.imageUrl).filter(Boolean),
          feedType: 'media',
          feedDate: first.createdAt,
        };
      }),
      ...singles.map(item => ({
        ...item,
        imageUrls: item.imageUrl ? [item.imageUrl] : [],
        feedType: 'media',
        feedDate: item.createdAt,
      })),
    ];
    return [...taskItems, ...mediaItems].sort(
      (a, b) => new Date(b.feedDate) - new Date(a.feedDate),
    );
  }, [tasks, media, search, filter]);

  function openTaskForm(task = null, project = null) {
    setEditingTaskId(task?._id || null);
    setFormProject(project);
    setTaskFormOpen(true);
  }
  function closeTaskForm() {
    setTaskFormOpen(false);
    setEditingTaskId(null);
    setFormProject(null);
  }
  function replaceTask(updated) {
    setTasks(items =>
      items.map(item => (item._id === updated._id ? updated : item)),
    );
    setSelectedTask(updated);
  }

  async function saveTask(form) {
    setSaving(true);
    try {
      const batchId = generateBatchId();
      const uploaded = await Promise.all(
        form.newImages.map(image =>
          uploadMedia(image, form.title, token, 'taskAttachment', batchId),
        ),
      );
      const imageUrls = [
        ...form.imageUrls,
        ...uploaded.map(item => item.imageUrl).filter(Boolean),
      ];
      const payload = { ...form, imageUrls, imageUrl: imageUrls[0] || '' };
      delete payload.newImages;
      const saved = editingTaskId
        ? await updateTask(editingTaskId, payload, token)
        : await createTask(payload, token);
      if (editingTaskId) replaceTask(saved);
      else setTasks(items => [saved, ...items]);
      closeTaskForm();
      setSelectedTask(saved);
    } catch (error) {
      showError('Could not save task', error);
    } finally {
      setSaving(false);
    }
  }
  async function toggleTask(task) {
    try {
      const updated = await updateTask(
        task._id,
        { completed: !task.completed },
        token,
      );
      replaceTask(updated);
    } catch (error) {
      showError('Could not update task', error);
    }
  }
  async function toggleSubtask(task, index) {
    try {
      const subtasks = task.subtasks.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item,
      );
      const updated = await updateTask(task._id, { subtasks }, token);
      replaceTask(updated);
    } catch (error) {
      showError('Could not update subtask', error);
    }
  }
  function removeTask(id) {
    ask({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTask(id, token);
          setTasks(items => items.filter(item => item._id !== id));
          setSelectedTask(null);
        } catch (error) {
          showError('Could not delete task', error);
        }
      },
    });
  }
  function removeMedia(item) {
    const idsToDelete = item.mediaIds?.length ? item.mediaIds : [item._id];
    ask({
      title: 'Delete Media',
      message:
        idsToDelete.length > 1
          ? `Permanently delete these ${idsToDelete.length} uploaded images?`
          : 'Permanently delete this uploaded image?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await Promise.all(idsToDelete.map(id => deleteMedia(id, token)));
          setMedia(items =>
            items.filter(value => !idsToDelete.includes(value._id)),
          );
        } catch (error) {
          showError('Could not delete media', error);
        }
      },
    });
  }
  async function saveProject(form) {
    setSaving(true);
    try {
      const project = await createProject(form, token);
      setProjects(items => [project, ...items]);
      setProjectFormOpen(false);
    } catch (error) {
      showError('Could not save project', error);
    } finally {
      setSaving(false);
    }
  }

  if (!token)
    return (
      <AlertNotificationRoot theme={preferences.theme}>
        <View className="flex-1 bg-canvas" style={appThemes[preferences.theme]}>
          <LoginScreen
            onLogin={login}
            onRegister={register}
            isLoading={authLoading}
          />
          <ConfirmDialog config={confirm} onCancel={closeConfirm} />
        </View>
      </AlertNotificationRoot>
    );

  const editingTask = editingTaskId
    ? tasks.find(task => task._id === editingTaskId)
    : null;
  return (
    <AlertNotificationRoot theme={preferences.theme}>
      <SafeAreaView
        className="flex-1 bg-canvas"
        style={appThemes[preferences.theme]}
      >
        <StatusBar
          barStyle={
            preferences.theme === 'dark' ? 'light-content' : 'dark-content'
          }
          backgroundColor={preferences.theme === 'dark' ? '#12111a' : '#ffffff'}
        />
        {activeTab === 'home' ? (
          <HomeScreen
            user={user}
            tasks={tasks}
            items={feedItems}
            loading={loading}
            refreshing={refreshing}
            searchText={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
            onRefresh={refresh}
            onTask={setSelectedTask}
            onDeleteMedia={removeMedia}
          />
        ) : activeTab === 'projects' ? (
          <ProjectsScreen
            projects={projects}
            tasks={tasks}
            onAdd={() => setProjectFormOpen(true)}
            onOpen={project => {
              setSelectedProject(project);
              setProjectDetailOpen(true);
            }}
          />
        ) : (
          <ProfileScreen
            user={user}
            tasks={tasks}
            projects={projects}
            onLogout={logout}
            theme={preferences.theme}
            notifications={preferences.notifications}
            onToggleTheme={preferences.toggleTheme}
            onToggleNotifications={preferences.toggleNotifications}
          />
        )}
        <BottomNav
          active={activeTab}
          onChange={setActiveTab}
        />
        <TouchableOpacity
          className="absolute h-[58px] w-[58px] items-center justify-center rounded-full bg-brand shadow-lg z-20"
          style={{ right: 20, bottom: 76 }}
          onPress={() => openTaskForm()}
        >
          <Text className="text-3xl font-light text-white">＋</Text>
        </TouchableOpacity>
        <ProjectDetailModal
          visible={projectDetailOpen}
          project={selectedProject}
          tasks={tasks}
          onClose={() => setProjectDetailOpen(false)}
          onTask={setSelectedTask}
          onAddTask={project => openTaskForm(null, project)}
        />
        <TaskDetailModal
          visible={!!selectedTask && !taskFormOpen}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggle={toggleTask}
          onEdit={task => openTaskForm(task)}
          onDelete={removeTask}
          onToggleSubtask={toggleSubtask}
        />
        <TaskFormModal
          visible={taskFormOpen}
          task={editingTask}
          project={formProject}
          projects={projects}
          saving={saving}
          onClose={closeTaskForm}
          onSave={saveTask}
        />
        <ProjectFormModal
          visible={projectFormOpen}
          saving={saving}
          onClose={() => setProjectFormOpen(false)}
          onSave={saveProject}
        />
        <ConfirmDialog config={confirm} onCancel={closeConfirm} />
      </SafeAreaView>
    </AlertNotificationRoot>
  );
}