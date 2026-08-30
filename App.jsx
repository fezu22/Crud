import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
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
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  AlertNotificationRoot,
  Dialog,
  ALERT_TYPE,
} from 'react-native-alert-notification';
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
} from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import AutoHeightImage from './src/components/AutoHeightImage';
import AnimatedImagePreview from './src/components/AnimatedImagePreview';
import COLORS from './src/theme/colors';
import formatTimestamp from './src/utils/formatTimestamp';
import styles from './src/styles/appStyles';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Storage Keys
const STORAGE_TOKEN_KEY = '@medi_user_token';
const STORAGE_USER_KEY = '@medi_user_data';


export default function App() {
  // Auth State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Feed State
  const [tasks, setTasks] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  // Post composer state
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [posting, setPosting] = useState(false);

  // Task editing state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingImageUris, setEditingImageUris] = useState([]);
  const composerMotion = useRef(new Animated.Value(0)).current;
  const lastScrollOffset = useRef(0);

  // Confirmation Modal
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
    setConfirmConfig((prev) => ({
      ...prev,
      visible: false,
      onConfirm: null,
    }));
  }

  // Auth persistence
  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(STORAGE_USER_KEY);

      if (storedToken) {
        setToken(storedToken);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }
  }

  async function saveSession(authToken, userData) {
    try {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, authToken);

      if (userData) {
        await AsyncStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify(userData)
        );
      }
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  async function clearSession() {
    try {
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  }

  // DATA LOADING
  useEffect(() => {
    if (token) {
      loadFeed(token);
    } else {
      setTasks([]);
      setMediaList([]);
      setEditingTaskId(null);
    }
    // Fetch only when the active session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadFeed(authToken = token) {
    if (!authToken) return;

    setFeedLoading(true);

    try {
      const [tasksData, mediaData] = await Promise.all([
        getTasks(authToken).catch(() => []),
        getMyMedia(authToken).catch(() => []),
      ]);

      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );

      setTasks(tasksData || []);
      setMediaList(mediaData || []);
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    } finally {
      setFeedLoading(false);
    }
  }

  async function onRefreshFeed() {
    if (!token) return;

    setFeedRefreshing(true);
    await loadFeed(token);
    setFeedRefreshing(false);
  }

  const feedItems = useMemo(() => {
    const taskItems = tasks.map((t) => ({
      ...t,
      feedType: 'task',
      feedDate:
        t.createdAt ||
        t.updatedAt ||
        new Date().toISOString(),
    }));

    const mediaItems = mediaList.map((m) => ({
      ...m,
      feedType: 'media',
      feedDate: m.createdAt || new Date().toISOString(),
    }));

    return [...taskItems, ...mediaItems].sort(
      (a, b) =>
        new Date(b.feedDate) - new Date(a.feedDate)
    );
  }, [tasks, mediaList]);

  // AUTH

  async function handleLogin(credentials) {
    Keyboard.dismiss();
    setAuthLoading(true);

    try {
      const data = await loginUser(
        credentials.identifier,
        credentials.password
      );

      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );

      setToken(data.token);
      setUser(data.user);

      await saveSession(data.token, data.user);
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Sign In Failed',
        textBody: err.message,
        button: 'OK',
      });

      throw err;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(regData) {
    const identifier = regData.email || regData.phone;

    const data = await registerUser(
      regData.name,
      identifier,
      regData.password
    );

    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );

    setToken(data.token);
    setUser(data.user);

    await saveSession(data.token, data.user);
  }

  function handleLogout() {
    showConfirm({
      title: 'Log Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      isDestructive: true,

      onConfirm: async () => {
        LayoutAnimation.configureNext(
          LayoutAnimation.Presets.easeInEaseOut
        );

        setToken(null);
        setUser(null);
        setTasks([]);
        setMediaList([]);

        await clearSession();
      },
    });
  }

  // IMAGE PICKER

  async function handlePickImage(sourceType) {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      includeBase64: false,
      selectionLimit: sourceType === 'camera' ? 1 : 8,
    };

    const launcher =
      sourceType === 'camera'
        ? launchCamera
        : launchImageLibrary;

    try {
      const result = await launcher(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Image Picker Error',
          textBody:
            result.errorMessage ||
            'Could not access photo source',
          button: 'OK',
        });

        return;
      }

      if (result.assets && result.assets.length > 0) {
        const validAssets = result.assets.filter((asset) => asset.uri);

        if (validAssets.length === 0) {
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: 'Image Error',
            textBody:
              'Selected image does not have a valid URI.',
            button: 'OK',
          });

          return;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedImages((current) => {
          const existingUris = new Set(current.map((asset) => asset.uri));
          const additions = validAssets.filter((asset) => !existingUris.has(asset.uri));
          return [...current, ...additions].slice(0, 8);
        });
      }
    } catch (err) {
      console.log('Picker error:', err);

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    }
  }

  function handleRemoveImage(index) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (index < editingImageUris.length) {
      setEditingImageUris((current) => current.filter((_, imageIndex) => imageIndex !== index));
      return;
    }
    const selectedIndex = index - editingImageUris.length;
    setSelectedImages((current) => current.filter((_, imageIndex) => imageIndex !== selectedIndex));
  }

  // CREATE POST

  async function handlePostTask() {
    const hasText = postText.trim().length > 0;
    const hasImage = selectedImages.length > 0;

    if (!hasText && !hasImage) {
      return;
    }

    Keyboard.dismiss();
    setPosting(true);

    try {
      let imageUrls = [];

      if (hasImage) {
        const imageTitle =
          postText.trim() || 'Task Image';

        const uploadedMedia = await Promise.all(
          selectedImages.map((image) => uploadMedia(image, imageTitle, token))
        );
        imageUrls = uploadedMedia.map((media) => media.imageUrl).filter(Boolean);
      }

      const createdTask = await createTask(
        {
          title: postText.trim(),
          description: '',
          imageUrl: imageUrls[0] || '',
          imageUrls,
        },
        token
      );

      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );

      setTasks((prev) => [
        createdTask,
        ...prev,
      ]);

      setPostText('');
      setSelectedImages([]);
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Post Failed',
        textBody: err.message,
        button: 'OK',
      });
    } finally {
      setPosting(false);
    }
  }

  // EDIT TASK

  async function handleSaveEdit() {
    if (
      !postText.trim() &&
      selectedImages.length === 0 &&
      editingImageUris.length === 0
    ) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Validation',
        textBody: 'Task text or image is required',
        button: 'OK',
      });

      return;
    }

    Keyboard.dismiss();
    setPosting(true);

    try {
      let finalImageUrls = [...editingImageUris];

      if (selectedImages.length > 0) {
        const imageTitle =
          postText.trim() || 'Task Image';

        const uploadedMedia = await Promise.all(
          selectedImages.map((image) => uploadMedia(image, imageTitle, token))
        );
        finalImageUrls = [
          ...finalImageUrls,
          ...uploadedMedia.map((media) => media.imageUrl).filter(Boolean),
        ];
      }

      const updated = await updateTask(
        editingTaskId,
        {
          title: postText.trim(),
          description: '',
          imageUrl: finalImageUrls[0] || '',
          imageUrls: finalImageUrls,
        },
        token
      );

      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );

      setTasks((prev) =>
        prev.map((t) =>
          t._id === editingTaskId
            ? updated
            : t
        )
      );

      setEditingTaskId(null);
      setEditingImageUris([]);
      setPostText('');
      setSelectedImages([]);
    } catch (err) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: err.message,
        button: 'OK',
      });
    } finally {
      setPosting(false);
    }
  }

  function handleEditTask(item) {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );

    if (editingTaskId === item._id) {
      setEditingTaskId(null);
      setEditingImageUris([]);
      setPostText('');
      setSelectedImages([]);

      return;
    }

    setEditingTaskId(item._id);
    setPostText(item.title || '');
    setEditingImageUris(
      item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []
    );
    setSelectedImages([]);
  }

  function handleCancelEdit() {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );

    setEditingTaskId(null);
    setEditingImageUris([]);
    setPostText('');
    setSelectedImages([]);
  }

  async function handleToggleTask(item) {
    try {
      const updated = await updateTask(
        item._id,
        {
          completed: !item.completed,
        },
        token
      );

      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );

      setTasks((prev) =>
        prev.map((t) =>
          t._id === item._id
            ? updated
            : t
        )
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
      message:
        'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,

      onConfirm: async () => {
        try {
          await deleteTask(id, token);

          LayoutAnimation.configureNext(
            LayoutAnimation.Presets
              .easeInEaseOut
          );

          setTasks((prev) =>
            prev.filter(
              (t) => t._id !== id
            )
          );
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

  function handleDeleteMedia(mediaItem) {
    showConfirm({
      title: 'Delete Media',
      message:
        'Permanently delete this image from your cloud storage?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,

      onConfirm: async () => {
        try {
          await deleteMedia(
            mediaItem._id,
            token
          );

          LayoutAnimation.configureNext(
            LayoutAnimation.Presets
              .easeInEaseOut
          );

          setMediaList((prev) =>
            prev.filter(
              (m) =>
                m._id !== mediaItem._id
            )
          );
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

  function renderFeedItem({ item }) {
    if (item.feedType === 'task') {
      return (
        <View style={styles.feedCard}>
          <TouchableOpacity
            style={styles.feedCardMain}
            onPress={() =>
              handleToggleTask(item)
            }
            activeOpacity={0.7}
          >
            <View
              style={
                item.completed
                  ? styles.checkboxDone
                  : styles.checkbox
              }
            >
              {item.completed ? (
                <Text style={styles.checkmark}>
                  ✓
                </Text>
              ) : null}
            </View>

            <View style={styles.flexOne}>
              <Text
                style={
                  item.completed
                    ? styles.feedTitleDone
                    : styles.feedTitle
                }
              >
                {item.title}
              </Text>

              {item.description ? (
                <Text
                  style={
                    item.completed
                      ? styles.feedDescDone
                      : styles.feedDesc
                  }
                >
                  {item.description}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          {item.imageUrl ? (
            <AutoHeightImage
              uri={item.imageUrl}
              style={styles.feedImageTop}
            />
          ) : null}

          <View
            style={styles.feedCardFooter}
          >
            <Text
              style={styles.feedTimestamp}
            >
              {formatTimestamp(
                item.feedDate
              )}
            </Text>

            <View
              style={styles.feedActions}
            >
              <TouchableOpacity
                style={[
                  styles.editBtn,
                  editingTaskId ===
                  item._id &&
                  styles.editBtnActive,
                ]}
                onPress={() =>
                  handleEditTask(item)
                }
              >
                <Text
                  style={[
                    styles.editText,
                    editingTaskId ===
                    item._id &&
                    styles.editTextActive,
                  ]}
                >
                  {editingTaskId ===
                    item._id
                    ? 'Cancel'
                    : 'Edit'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.delBtn}
                onPress={() =>
                  handleDeleteTask(
                    item._id
                  )
                }
              >
                <Text
                  style={styles.delText}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.feedCard}>
        {item.imageUrl ? (
          <AutoHeightImage
            uri={item.imageUrl}
            style={styles.feedImageBottom}
          />
        ) : null}

        <View
          style={styles.feedMediaInfo}
        >
          <Text
            style={styles.feedTitle}
            numberOfLines={2}
          >
            {item.title ||
              'Uploaded Image'}
          </Text>
        </View>

        <View
          style={styles.feedCardFooter}
        >
          <Text
            style={styles.feedTimestamp}
          >
            {formatTimestamp(
              item.feedDate
            )}
          </Text>

          <TouchableOpacity
            style={styles.delBtn}
            onPress={() =>
              handleDeleteMedia(item)
            }
          >
            <Text
              style={styles.delText}
            >
              ✕
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderEmptyFeed() {
    return (
      <View
        style={styles.emptyContainer}
      >
        <View
          style={styles.emptyIconCircle}
        >
          <Text
            style={styles.emptyIcon}
          >
            📝
          </Text>
        </View>

        <Text
          style={styles.emptyTitle}
        >
          Your Feed is Empty
        </Text>

        <Text
          style={styles.emptySubtitle}
        >
          Write your first task or
          upload a photo{'\n'}to get
          started!
        </Text>
      </View>
    );
  }

  function renderConfirmModal() {
    return (
      <Modal
        transparent
        visible={
          confirmConfig.visible
        }
        animationType="fade"
        onRequestClose={
          hideConfirm
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={
              styles.sweetAlertCard
            }
          >
            <View
              style={
                styles.warningIconCircle
              }
            >
              <Text
                style={
                  styles.warningIconSymbol
                }
              >
                !
              </Text>
            </View>

            <Text
              style={
                styles.sweetAlertTitle
              }
            >
              {confirmConfig.title}
            </Text>

            <Text
              style={
                styles.sweetAlertMessage
              }
            >
              {confirmConfig.message}
            </Text>

            <View
              style={
                styles.sweetAlertButtonRow
              }
            >
              <TouchableOpacity
                style={
                  styles.sweetAlertCancelBtn
                }
                activeOpacity={0.7}
                onPress={
                  hideConfirm
                }
              >
                <Text
                  style={
                    styles.sweetAlertCancelText
                  }
                >
                  {
                    confirmConfig.cancelText
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sweetAlertConfirmBtn,
                  confirmConfig.isDestructive &&
                  styles.sweetAlertDestructiveBtn,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  const action =
                    confirmConfig.onConfirm;

                  hideConfirm();

                  if (action) {
                    action();
                  }
                }}
              >
                <Text
                  style={
                    styles.sweetAlertConfirmText
                  }
                >
                  {
                    confirmConfig.confirmText
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // LOGIN SCREEN

  if (!token) {
    return (
      <AlertNotificationRoot theme="dark">
        <LoginScreen
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={authLoading}
        />

        {renderConfirmModal()}
      </AlertNotificationRoot>
    );
  }

  const isPostDisabled =
    posting ||
    (postText.trim().length === 0 &&
      selectedImages.length === 0);

  const previewItems = [
    ...editingImageUris.map((uri) => ({ uri, persisted: true })),
    ...selectedImages.map((asset) => ({ ...asset, persisted: false })),
  ];

  function handleFeedScroll(event) {
    const offset = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = offset - lastScrollOffset.current;
    if (Math.abs(delta) > 6) {
      Animated.spring(composerMotion, {
        toValue: delta > 0 ? 1 : 0,
        tension: 90,
        friction: 12,
        useNativeDriver: true,
      }).start();
      lastScrollOffset.current = offset;
    }
  }

  return (
    <AlertNotificationRoot theme="dark">
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.bg}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={styles.headerTitle}
            >
              TaskFlow
            </Text>

            <Text
              style={styles.headerSub}
            >
              Hello,{' '}
              <Text
                style={
                  styles.userNameHighlight
                }
              >
                {user?.name ||
                  user?.phoneNumber ||
                  'User'}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text
              style={
                styles.logoutBtnText
              }
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Composer */}
        <Animated.View
          style={[
            styles.composerCard,
            {
              opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
              transform: [{
                translateY: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }),
              }],
            },
          ]}
        >
          {editingTaskId && (
            <View
              style={
                styles.editingBanner
              }
            >
              <Text
                style={
                  styles.editingBannerText
                }
              >
                ✏️ Editing Post
              </Text>

              <TouchableOpacity
                onPress={
                  handleCancelEdit
                }
              >
                <Text
                  style={
                    styles.editingBannerCancel
                  }
                >
                  ✕ Cancel Edit
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.composerInput}
            placeholder={
              editingTaskId
                ? 'Edit your task...'
                : "What's on your mind?"
            }
            placeholderTextColor={
              COLORS.textMuted
            }
            value={postText}
            onChangeText={setPostText}
            multiline
            maxLength={500}
          />

          {previewItems.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewList}
            >
              {previewItems.map((item, index) => (
                <AnimatedImagePreview
                  key={`${item.uri}-${index}`}
                  uri={item.uri}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}
            </ScrollView>
          )}

          <View
            style={
              styles.composerActions
            }
          >
            <View
              style={
                styles.mediaButtons
              }
            >
              <TouchableOpacity
                style={
                  styles.mediaIconBtn
                }
                onPress={() =>
                  handlePickImage(
                    'camera'
                  )
                }
                disabled={posting}
              >
                <Text
                  style={
                    styles.mediaIconText
                  }
                >
                  📷
                </Text>

                <Text
                  style={
                    styles.mediaIconLabel
                  }
                >
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.mediaIconBtn
                }
                onPress={() =>
                  handlePickImage(
                    'library'
                  )
                }
                disabled={posting}
              >
                <Text
                  style={
                    styles.mediaIconText
                  }
                >
                  🖼️
                </Text>

                <Text
                  style={
                    styles.mediaIconLabel
                  }
                >
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.postBtnRow
              }
            >
              {editingTaskId && (
                <TouchableOpacity
                  style={
                    styles.cancelEditBtn
                  }
                  onPress={
                    handleCancelEdit
                  }
                >
                  <Text
                    style={
                      styles.cancelEditText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.postBtn,
                  isPostDisabled &&
                  styles.postBtnDisabled,
                ]}
                onPress={
                  editingTaskId
                    ? handleSaveEdit
                    : handlePostTask
                }
                disabled={
                  editingTaskId
                    ? !postText.trim() &&
                    selectedImages.length === 0 &&
                    editingImageUris.length === 0
                    : isPostDisabled
                }
                activeOpacity={0.85}
              >
                {posting ? (
                  <ActivityIndicator
                    color={
                      COLORS.white
                    }
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      styles.postBtnText
                    }
                  >
                    {editingTaskId
                      ? 'Update'
                      : 'Post Task'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Feed */}
        <View
          style={styles.feedContainer}
        >
          {feedLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.accent}
              style={styles.feedLoader}
            />
          ) : (
            <FlatList
              data={feedItems}
              keyExtractor={(item) =>
                item._id
              }
              renderItem={
                renderFeedItem
              }
              refreshing={
                feedRefreshing
              }
              onRefresh={
                onRefreshFeed
              }
              onScroll={handleFeedScroll}
              scrollEventThrottle={16}
              contentContainerStyle={
                feedItems.length === 0
                  ? styles.flexOne
                  : styles.feedListContent
              }
              ListEmptyComponent={
                renderEmptyFeed
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {renderConfirmModal()}
      </SafeAreaView>
    </AlertNotificationRoot>
  );
}

// STYLES
