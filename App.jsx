import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  AlertNotificationRoot,
  Dialog,
  ALERT_TYPE,
} from 'react-native-alert-notification';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  // Auth State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authLoading, setAuthLoading] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Task State
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // SweetAlert2-Style Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: null,
  });

  function showConfirm({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
  }) {
    setConfirmConfig({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm,
    });
  }

  function hideConfirm() {
    setConfirmConfig((prev) => ({ ...prev, visible: false, onConfirm: null }));
  }

  // Load tasks when token changes / user logs in
  useEffect(() => {
    if (token) {
      setTasksLoading(true);
      loadTasks(token).finally(() => setTasksLoading(false));
    } else {
      setTasks([]);
      setEditingId(null);
    }
  }, [token]);

  async function loadTasks(authToken = token) {
    if (!authToken) return;
    try {
      const data = await getTasks(authToken);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTasks(data || []);
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    }
  }

  async function onRefresh() {
    if (!token) return;
    setRefreshing(true);
    await loadTasks(token);
    setRefreshing(false);
  }

  // Handle Authentication
  async function handleAuthSubmit() {
    if (!authEmail.trim() || !authPassword.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Validation',
        textBody: 'Please fill in all required fields',
        button: 'OK',
      });
      return;
    }

    if (authMode === 'register' && !authName.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Validation',
        textBody: 'Please provide your full name',
        button: 'OK',
      });
      return;
    }

    if (authPassword.length < 6) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Validation',
        textBody: 'Password must be at least 6 characters',
        button: 'OK',
      });
      return;
    }

    Keyboard.dismiss();
    setAuthLoading(true);

    try {
      let data;
      if (authMode === 'register') {
        data = await registerUser(authName.trim(), authEmail.trim(), authPassword);
      } else {
        data = await loginUser(authEmail.trim(), authPassword);
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setToken(data.token);
      setUser(data.user);
      setAuthPassword('');
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Authentication Error',
        textBody: err.message,
        button: 'OK',
      });
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    showConfirm({
      title: 'Log Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setToken(null);
        setUser(null);
        setTasks([]);
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      },
    });
  }

  // Handle Task Operations
  async function handleSaveTask() {
    if (!title.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Validation',
        textBody: 'Task title is required',
        button: 'OK',
      });
      return;
    }

    Keyboard.dismiss();

    try {
      if (editingId) {
        // Updating an existing task
        const updated = await updateTask(
          editingId,
          {
            title: title.trim(),
            description: desc.trim(),
          },
          token
        );
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingId ? updated : t))
        );
        setEditingId(null);
      } else {
        // Creating a new task
        const created = await createTask(
          {
            title: title.trim(),
            description: desc.trim(),
          },
          token
        );
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTasks((prev) => [created, ...prev]);
      }
      setTitle('');
      setDesc('');
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    }
  }

  function handleEditTask(item) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingId(item._id);
    setTitle(item.title);
    setDesc(item.description || '');
  }

  function handleCancelEdit() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingId(null);
    setTitle('');
    setDesc('');
  }

  async function handleToggleTask(item) {
    try {
      const updated = await updateTask(
        item._id,
        { completed: !item.completed },
        token
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTasks((prev) =>
        prev.map((t) => (t._id === item._id ? updated : t))
      );
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    }
  }

  function handleDeleteTask(id) {
    showConfirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTask(id, token);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTasks((prev) => prev.filter((t) => t._id !== id));
        } catch (err) {
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: 'Error',
            textBody: err.message,
            button: 'OK',
          });
        }
      },
    });
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  function renderTaskItem({ item }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => handleToggleTask(item)}
        >
          <View style={item.completed ? styles.checkboxDone : styles.checkbox}>
            {item.completed ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={item.completed ? styles.titleDone : styles.cardTitle}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={item.completed ? styles.descDone : styles.cardDesc}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEditTask(item)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.delBtn}
            onPress={() => handleDeleteTask(item._id)}
          >
            <Text style={styles.delText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // SweetAlert2-Style Confirmation Modal Component
  const renderConfirmModal = () => (
    <Modal
      transparent
      visible={confirmConfig.visible}
      animationType="fade"
      onRequestClose={hideConfirm}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sweetAlertCard}>
          {/* Pulsing SweetAlert2 Warning Icon */}
          <View style={styles.warningIconCircle}>
            <Text style={styles.warningIconSymbol}>!</Text>
          </View>

          <Text style={styles.sweetAlertTitle}>{confirmConfig.title}</Text>
          <Text style={styles.sweetAlertMessage}>{confirmConfig.message}</Text>

          <View style={styles.sweetAlertButtonRow}>
            <TouchableOpacity
              style={styles.sweetAlertCancelBtn}
              activeOpacity={0.7}
              onPress={hideConfirm}
            >
              <Text style={styles.sweetAlertCancelText}>
                {confirmConfig.cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sweetAlertConfirmBtn,
                confirmConfig.isDestructive && styles.sweetAlertDestructiveBtn,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                const action = confirmConfig.onConfirm;
                hideConfirm();
                if (action) action();
              }}
            >
              <Text style={styles.sweetAlertConfirmText}>
                {confirmConfig.confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Unauthenticated Auth Screen
  if (!token) {
    return (
      <AlertNotificationRoot theme="dark">
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.authScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* App Brand Header */}
              <View style={styles.brandContainer}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoText}>⚡</Text>
                </View>
                <Text style={styles.brandTitle}>TaskFlow</Text>
                <Text style={styles.brandSubtitle}>
                  {authMode === 'login'
                    ? 'Welcome back! Sign in to continue'
                    : 'Create an account to get started'}
                </Text>
              </View>

              {/* Auth Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    authMode === 'login' && styles.tabBtnActive,
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAuthMode('login');
                  }}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      authMode === 'login' && styles.tabBtnTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    authMode === 'register' && styles.tabBtnActive,
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAuthMode('register');
                  }}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      authMode === 'register' && styles.tabBtnTextActive,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Auth Form Card */}
              <View style={styles.authCard}>
                {authMode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.authInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#64748b"
                      value={authName}
                      onChangeText={setAuthName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#64748b"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.authInput}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#64748b"
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.authSubmitBtn}
                  onPress={handleAuthSubmit}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.authSubmitText}>
                      {authMode === 'login' ? 'Sign In' : 'Register'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                }}
              >
                <Text style={styles.switchModeText}>
                  {authMode === 'login'
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          {renderConfirmModal()}
        </SafeAreaView>
      </AlertNotificationRoot>
    );
  }

  // Authenticated Main Task Screen
  return (
    <AlertNotificationRoot theme="dark">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

        {/* Main Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>TaskFlow</Text>
            <Text style={styles.headerSub}>
              Hello, <Text style={styles.userNameHighlight}>{user?.name || 'User'}</Text>
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {completedCount}/{tasks.length} Done
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Task title..."
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)..."
            placeholderTextColor="#64748b"
            value={desc}
            onChangeText={setDesc}
            multiline
          />
          <View style={styles.formRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveTask}>
              <Text style={styles.btnText}>
                {editingId ? 'Update Task' : 'Add Task'}
              </Text>
            </TouchableOpacity>
            {editingId ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Task List */}
        <View style={styles.list}>
          {tasksLoading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item._id}
              renderItem={renderTaskItem}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No tasks yet. Add one above!</Text>
              }
            />
          )}
        </View>

        {renderConfirmModal()}
      </SafeAreaView>
    </AlertNotificationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  // Auth Styles
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#6366f1',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  authCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  authInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  authSubmitBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  authSubmitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchModeBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },

  // Header & Main App Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  userNameHighlight: {
    color: '#818cf8',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#818cf8',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 12,
  },
  form: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: '#334155',
    padding: 11,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxDone: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  check: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  titleDone: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  descDone: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  editText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  delBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  delText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // SweetAlert2 Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sweetAlertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIconSymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f59e0b',
    lineHeight: 36,
  },
  sweetAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  sweetAlertMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  sweetAlertButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  sweetAlertCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweetAlertCancelText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  sweetAlertConfirmBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweetAlertDestructiveBtn: {
    backgroundColor: '#ef4444',
  },
  sweetAlertConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

