import React, { useEffect, useRef, useState } from 'react';
import './global.css';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StatusBar,
  UIManager,
  View,
} from 'react-native';
import {
  AlertNotificationRoot,
  ALERT_TYPE,
  Dialog,
} from 'react-native-alert-notification';

import DraggableSuccessModal from './src/components/DraggableSuccessModal';
import ConfirmDialog from './src/components/ConfirmDialog';
import BottomNav from './src/navigation/BottomNav';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import MediaLibraryScreen from './src/screens/MediaLibraryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import ProjectsScreen from './src/screens/projects/ProjectsScreen';
import ProjectDetailModal from './src/screens/projects/ProjectDetailModal';
import ProjectFormModal from './src/screens/projects/ProjectFormModal';
import TaskDetailModal from './src/screens/tasks/TaskDetailModal';
import TaskFormModal from './src/screens/tasks/TaskFormModal';
import useFeedItems from './src/hooks/useFeedItems';
import usePreferences from './src/hooks/usePreferences';
import useTasks from './src/hooks/useTasks';
import { appThemes } from './src/theme/appTheme';
import {
  cancelTaskReminders,
  syncTaskReminders,
} from './src/services/notifications';
import {
  createProject,
  deleteMedia,
  getMyMedia,
  getProjects,
  getTasks,
  loginUser,
  registerUser,
  uploadLibraryMedia,
} from './src/services/api';
import { clearSession, loadSession, saveSession } from './src/storage/sessionStorage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
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

export default function App() {
  const preferences = usePreferences();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [media, setMedia] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [confirm, setConfirm] = useState(emptyConfirm);
  const [taskOriginTab, setTaskOriginTab] = useState(null);
  const [successModal, setSuccessModal] = useState({
    visible: false,
    message: '',
    host: 'screen',
  });
  const successTimeoutRef = useRef(null);
  const {
    tasks, setTasks, selectedTask, setSelectedTask, taskFormOpen, editingTask,
    formProject, savingTask, resetTasks, openTaskForm, closeTaskForm, saveTask,
    toggleTask, toggleSubtask, removeTask, removeTaskImage,
  } = useTasks({
    token,
    ask,
    showError,
    showSuccess,
    setMedia,
    onTaskCompleted: cancelTaskReminders,
    onTaskDeleted: cancelTaskReminders,
  });
  const feedItems = useFeedItems({ tasks, media, search, filter });

  function showSuccess(message, host = 'screen') {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    const resolvedHost =
      host === 'taskDetail' && !selectedTask ? 'screen' : host;
    setSuccessModal({ visible: true, message, host: resolvedHost });
    successTimeoutRef.current = setTimeout(() => {
      setSuccessModal({ visible: false, message: '', host: 'screen' });
      successTimeoutRef.current = null;
    }, 2500);
  }

  function closeSuccess() {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    const host = successModal.host;
    setSuccessModal({ visible: false, message: '', host: 'screen' });
    return host;
  }

  useEffect(() => { restoreSession(); }, []);
  useEffect(() => () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }, []);
  useEffect(() => {
    if (token) loadWorkspace(token);
    else resetWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => {
    if (!preferences.ready || !token) return;
    syncTaskReminders(tasks, preferences.notifications).catch(error =>
      console.warn('Could not sync task reminders:', error),
    );
  }, [preferences.notifications, preferences.ready, tasks, token]);

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
    resetTasks();
    setMedia([]);
    setProjects([]);
    setSelectedProject(null);
    setProjectDetailOpen(false);
    setActiveTab('home');
  }
  function showError(title, error) {
    Dialog.show({ type: ALERT_TYPE.DANGER, title, textBody: error.message, button: 'OK' });
  }
  function ask(config) {
    setConfirm({ ...emptyConfirm, ...config, visible: true });
  }
  function closeConfirm() {
    setConfirm(current => ({ ...current, visible: false, onConfirm: null }));
  }
  function openTaskDetail(task) {
    setTaskOriginTab(activeTab);
    setSelectedTask(task);
  }
  function handleSuccessOk() {
    const host = closeSuccess();
    if (host === 'taskDetail') {
      setSelectedTask(null);
      if (taskOriginTab) {
        setActiveTab(taskOriginTab);
      }
      setTaskOriginTab(null);
    }
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
      const data = await loginUser(credentials.identifier, credentials.password);
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
  function removeMedia(item) {
    const ids = item.mediaIds?.length ? item.mediaIds : [item._id];
    ask({
      title: 'Delete Media',
      message: ids.length > 1
        ? `Permanently delete these ${ids.length} uploaded images?`
        : 'Permanently delete this uploaded image?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await Promise.all(ids.map(id => deleteMedia(id, token)));
          setMedia(items => items.filter(value => !ids.includes(value._id)));
        } catch (error) {
          showError('Could not delete media', error);
        }
      },
    });
  }
  async function addLibraryMedia(file, title) {
    setUploadingMedia(true);
    try {
      const uploaded = await uploadLibraryMedia(file, title, token);
      setMedia(items => [uploaded, ...items]);
      showSuccess('Media uploaded!');
    } catch (error) {
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  }
  function removeLibraryMedia(item) {
    ask({
      title: 'Delete Media',
      message: 'Delete this file from Cloudinary and your library?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteMedia(item._id, token);
          setMedia(items => items.filter(value => value._id !== item._id));
        } catch (error) {
          showError('Could not delete media', error);
        }
      },
    });
  }
  async function saveProject(form) {
    setSavingProject(true);
    try {
      const project = await createProject(form, token);
      setProjects(items => [project, ...items]);
      setProjectFormOpen(false);
    } catch (error) {
      showError('Could not save project', error);
    } finally {
      setSavingProject(false);
    }
  }

  if (!token) {
    return (
      <AlertNotificationRoot theme={preferences.theme}>
        <View className="flex-1 bg-canvas" style={appThemes[preferences.theme]}>
          <LoginScreen onLogin={login} onRegister={register} isLoading={authLoading} />
          <ConfirmDialog config={confirm} onCancel={closeConfirm} />
        </View>
      </AlertNotificationRoot>
    );
  }

  return (
    <AlertNotificationRoot theme={preferences.theme}>
      <View className="flex-1 bg-canvas" style={appThemes[preferences.theme]}>
        <SafeAreaView className="flex-1 bg-canvas" style={appThemes[preferences.theme]}>
          <StatusBar
            barStyle={preferences.theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={preferences.theme === 'dark' ? '#12111a' : '#ffffff'}
          />
          {activeTab === 'home' ? (
            <HomeScreen
              user={user} tasks={tasks} items={feedItems} loading={loading}
              refreshing={refreshing} searchText={search} onSearch={setSearch}
              filter={filter} onFilter={setFilter} onRefresh={refresh}
              onTask={openTaskDetail} onDeleteMedia={removeMedia}
              onAddTask={() => openTaskForm()}
            />
          ) : activeTab === 'projects' ? (
            <ProjectsScreen
              projects={projects} tasks={tasks}
              onAdd={() => setProjectFormOpen(true)}
              onOpen={project => {
                setSelectedProject(project);
                setProjectDetailOpen(true);
              }}
            />
          ) : activeTab === 'media' ? (
            <MediaLibraryScreen
              media={media}
              uploading={uploadingMedia}
              onUpload={addLibraryMedia}
              onDelete={removeLibraryMedia}
              onError={error => showError('Could not select media', error)}
            />
          ) : (
            <ProfileScreen
              user={user} tasks={tasks} projects={projects} onLogout={logout}
              theme={preferences.theme} notifications={preferences.notifications}
              onToggleTheme={preferences.toggleTheme}
              onToggleNotifications={preferences.toggleNotifications}
            />
          )}
          <BottomNav active={activeTab} onChange={setActiveTab} />
          <ProjectDetailModal
            visible={projectDetailOpen} project={selectedProject} tasks={tasks}
            onClose={() => setProjectDetailOpen(false)} onTask={openTaskDetail}
            onAddTask={project => openTaskForm(null, project)}
          />
          <TaskDetailModal
            visible={!!selectedTask && !taskFormOpen} task={selectedTask}
            onClose={() => {
              setSelectedTask(null);
              if (taskOriginTab) setActiveTab(taskOriginTab);
              setTaskOriginTab(null);
            }}
            onToggle={toggleTask}
            onEdit={task => openTaskForm(task)} onDelete={removeTask}
            onToggleSubtask={toggleSubtask}
            successNotification={
              successModal.host === 'taskDetail' ? successModal : null
            }
            onSuccessOk={handleSuccessOk}
          />
          <TaskFormModal
            visible={taskFormOpen} task={editingTask} project={formProject}
            projects={projects} saving={savingTask} onClose={closeTaskForm}
            onSave={saveTask} onDeleteImage={removeTaskImage}
          />
          <ProjectFormModal
            visible={projectFormOpen} saving={savingProject}
            onClose={() => setProjectFormOpen(false)} onSave={saveProject}
          />
          <ConfirmDialog config={confirm} onCancel={closeConfirm} />
        </SafeAreaView>
        {successModal.visible && successModal.host === 'screen' && (
          <DraggableSuccessModal
            visible={successModal.visible}
            message={successModal.message}
            onClose={handleSuccessOk}
          />
        )}
      </View>
    </AlertNotificationRoot>
  );
}
