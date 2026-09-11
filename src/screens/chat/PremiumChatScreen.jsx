import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import {
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';

import {
  deleteChatMessages,
  editChatMessage,
  getChatMessages,
  sendChatMessage,
  uploadChatAttachment,
} from '../../services/api';
import { API_BASE_URL } from '../../config/apiConfig';

import { createSocket } from '../../services/socketService';

import AttachmentSheet from '../../components/chat/AttachmentSheet';
import ChatBackground from '../../components/chat/ChatBackground';
import ChatHeader from '../../components/chat/ChatHeader';
import DocumentBubble from '../../components/chat/DocumentBubble';
import DocumentPreviewModal from '../../components/chat/DocumentPreviewModal';
import ImageMessage from '../../components/chat/ImageMessage';
import ImageViewerModal from '../../components/chat/ImageViewerModal';
import MessageBubble from '../../components/chat/MessageBubble';
import VoiceMessageBubble, {
  seededWaveform,
} from '../../components/chat/VoiceMessageBubble';
import VoiceRecorderModal from '../../components/chat/VoiceRecorderModal';
import {
  MicIcon,
  PaperclipIcon,
  SendIcon,
} from '../../components/chat/ChatIcons';

import { FadeSlideIn, SkeletonBlock } from '../../components/motion';
import { getChatTheme } from '../../theme/chatTheme';
import {
  loadCachedMessages,
  saveCachedMessages,
} from '../../storage/chatStorage';

function sameDay(firstDate, secondDate) {
  if (!secondDate) {
    return false;
  }

  const first = new Date(firstDate);
  const second = new Date(secondDate);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function makeId() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function dayLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) {
    return 'Today';
  }

  if (sameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function buildRows(messages) {
  const rows = [];

  messages
    .filter(message => {
      const type = String(message?.type || message?.messageType || '').toLowerCase();
      const hasText = Boolean(message?.text || message?.caption);
      const hasMedia =
        (type === 'image' || type === 'video') &&
        Boolean(message?.attachmentUrl || message?.imageUrl);
      const hasDocument =
        (type === 'document' || type === 'pdf') &&
        Boolean(message?.fileName || message?.attachmentUrl);
      const hasVoice = (
        type === 'voice' ||
        type === 'audio' ||
        type.startsWith('audio/') ||
        String(message?.fileType || '').toLowerCase().startsWith('audio/') ||
        Boolean(message?.audioUrl)
      ) && Boolean(message?.attachmentUrl || message?.audioUrl || message?.uri);

      return hasText || hasMedia || hasDocument || hasVoice;
    })
    .forEach((message, index, visibleMessages) => {
      const previous = visibleMessages[index - 1];

      if (
        !previous ||
        !sameDay(previous.createdAt, message.createdAt)
      ) {
        rows.push({
          kind: 'day',
          id: `day-${message._id}`,
          date: message.createdAt,
        });
      }

      rows.push({
        kind: 'message',
        id: message._id,
        message,
      });
    });

  return rows;
}

function idOf(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value._id || value.id || null;
  }

  return value;
}

function isVideoAttachment(attachment) {
  const type = attachment?.type || '';
  const name = attachment?.fileName || '';

  return (
    type.startsWith('video/') ||
    /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(name)
  );
}

function normalizeServerMessage(message, userId) {
  const isMine =
    String(idOf(message.sender)) === String(userId);
  // GridFS files must use our API URL so the native media view can request
  // them with the current auth token. Do not let a stale imageUrl win.
  const attachmentUrl = message.attachmentFileId
    ? `${API_BASE_URL}/chat/attachments/${String(message.attachmentFileId)}`
    : message.attachmentUrl || message.audioUrl || message.imageUrl || message.uri || '';
  const rawType = String(
    message.type ||
    message.messageType ||
    (String(message.fileType || '').toLowerCase().startsWith('audio/') ? 'audio' : '') ||
    (message.audioUrl ? 'audio' : 'text'),
  ).toLowerCase();
  const type = rawType === 'audio' || rawType.startsWith('audio/') ? 'voice' : rawType;
  const mediaCaption =
    (rawType === 'image' || rawType === 'video') && !message.text
      ? String(message.caption || '').trim()
      : '';

  return {
    ...message,
    _id: message._id ? String(message._id) : makeId(),
    type,
    text: message.text || mediaCaption,
    sender: isMine ? 'me' : 'them',
    imageUrl: attachmentUrl,
    attachmentUrl:
      attachmentUrl,
    createdAt:
      message.createdAt ||
      new Date().toISOString(),
    status: isMine
      ? message.read
        ? 'read'
        : 'sent'
      : 'read',
  };
}

function isDocumentFile(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();

  const isVisual = (
    type.startsWith('image/') ||
    type.startsWith('video/') ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif|mp4|mov|m4v|webm|mkv|avi)$/i.test(name)
  );

  if (isVisual) return false;

  const hasDocumentExtension = /\.(pdf|doc|docx|txt|csv|xls|xlsx|ppt|pptx|zip|rtf|odt|ods|odp|mp3|wav|m4a|aac|ogg|flac)$/i.test(name);
  const isDocumentMime = type.startsWith('application/') || type.startsWith('text/') || type.startsWith('audio/');

  return hasDocumentExtension || isDocumentMime;
}

function ChatSkeleton({ theme, contact }) {
  // Theme-aware shimmer blocks: the old skeleton hardcoded dark colors and
  // was invisible on the light theme.
  const block = style => <SkeletonBlock theme={theme} style={[styles.skeletonBlock, style]} />;

  return (
    <View style={[styles.fullPageLoading, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.barStyle} backgroundColor={theme.background} />
      <ChatBackground theme={theme} />
      <View style={[styles.skeletonHeader, { borderBottomColor: theme.line }]}>
        {block(styles.skeletonBack)}
        <View style={styles.skeletonProfile}>
          {block(styles.skeletonName)}
          {block(styles.skeletonStatus)}
        </View>
        <View style={styles.skeletonHeaderActions}>
          {block(styles.skeletonIcon)}
          {block(styles.skeletonIcon)}
        </View>
      </View>
      <View style={styles.skeletonMessages}>
        <View style={styles.skeletonIncoming}>
          {block(styles.skeletonImage)}
          {block(styles.skeletonLineShort)}
        </View>
        <View style={styles.skeletonOutgoing}>
          {block(styles.skeletonImage)}
          {block(styles.skeletonLineMedium)}
        </View>
        <View style={styles.skeletonIncoming}>
          {block(styles.skeletonLineLong)}
          {block(styles.skeletonLineShort)}
        </View>
      </View>
      <View style={[styles.skeletonComposer, { borderTopColor: theme.line }]}>
        {block(styles.skeletonAttach)}
        {block(styles.skeletonInput)}
        {block(styles.skeletonAttach)}
      </View>
      <Text style={[styles.loadingText, { color: theme.muted }]}>Loading {contact?.name || 'chat'}...</Text>
    </View>
  );
}

export default function PremiumChatScreen({
  contact,
  token,
  user,
  onError,
  onBack,
  zegoStatus,
  onRetryZego,
  themeMode = 'dark',
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [cacheHydrated, setCacheHydrated] = useState(false);
  const [sendingText, setSendingText] = useState(false);
  const [contactOnline, setContactOnline] = useState(Boolean(contact?.online));
  const [contactLastSeen, setContactLastSeen] = useState(contact?.lastSeenAt || null);
  const [showJump, setShowJump] = useState(false);
  const [attachmentOpen, setAttachmentOpen] =
    useState(false);
  const [pendingImage, setPendingImage] =
    useState(null);
  const [pendingDocument, setPendingDocument] =
    useState(null);
  const [, setUploadingAttachment] = useState(false);
  const [, setUploadProgress] = useState(0);
  const [, setUploadError] = useState('');
  const [viewingImage, setViewingImage] =
    useState(null);
  const [viewingDocument, setViewingDocument] =
    useState(null);
  const [recordingOpen, setRecordingOpen] =
    useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletePromptVisible, setDeletePromptVisible] = useState(false);

  const statusTimers = useRef([]);
  const listRef = useRef(null);
  const nearBottom = useRef(true);
  const onErrorRef = useRef(onError);
  const hydratedConversationRef = useRef(null);

  const jumpOpacity = useRef(
    new Animated.Value(0),
  ).current;

  const theme = getChatTheme(themeMode);

  const currentUserId =
    user?.id || user?._id;

  const contactId =
    contact?.id || contact?._id;

  const conversationId = [currentUserId, contactId]
    .map(String)
    .sort()
    .join('_');

  const syncWithServer = Boolean(
    token &&
    currentUserId &&
    contactId &&
    String(contactId) &&
    String(contactId) !== String(currentUserId),
  );

  useEffect(() => {
    if (!token || !currentUserId) {
      return undefined;
    }

    const socket = createSocket(token);

    const onPresenceUpdate = event => {
      if (String(event?.userId || '') === String(contactId)) {
        setContactOnline(Boolean(event.online));
        if (event.lastSeenAt) setContactLastSeen(event.lastSeenAt);
      }
    };
    socket.on('presence:update', onPresenceUpdate);

    return () => {
      socket.off('presence:update', onPresenceUpdate);
    };
  }, [contactId, currentUserId, token]);

  useEffect(() => {
    const socket = createSocket(token);
    if (!syncWithServer) return undefined;

    const onChatMessage = message => {
      if (message.conversationId !== conversationId) return;

      // The sender already has an optimistic bubble and replaces it with the
      // upload response. Do not add the same server echo a second time.
      if (String(idOf(message.sender)) === String(currentUserId)) return;

      setMessages(current => {
        const messageId = String(message._id || '');
        if (current.some(item => String(item._id) === messageId)) return current;
        return [...current, normalizeServerMessage(message, currentUserId)].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });
    };

    const onChatMessageDeleted = event => {
      const deletedIds = new Set(
        (event.messageIds || (event.messageId ? [event.messageId] : []))
          .map(String),
      );
      if (!deletedIds.size) return;
      setMessages(current => current.filter(item => !deletedIds.has(String(item._id))));
      setSelectedMessageIds(current => current.filter(id => !deletedIds.has(String(id))));
    };

    const onChatMessageUpdated = message => {
      if (message.conversationId !== conversationId) return;
      setMessages(current => current.map(item => (
        String(item._id) === String(message._id)
          ? normalizeServerMessage(message, currentUserId)
          : item
      )));
    };

    socket.emit('chat:join', { conversationId });
    socket.on('chat:message', onChatMessage);
    socket.on('chat:message-deleted', onChatMessageDeleted);
    socket.on('chat:message-updated', onChatMessageUpdated);
    return () => {
      socket.emit('chat:leave', { conversationId });
      socket.off('chat:message', onChatMessage);
      socket.off('chat:message-deleted', onChatMessageDeleted);
      socket.off('chat:message-updated', onChatMessageUpdated);
    };
  }, [conversationId, currentUserId, syncWithServer, token]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const loadServerMessages = useCallback(
    async () => {
      if (!syncWithServer) {
        return;
      }

      try {
        const data = await getChatMessages(
          contactId,
          token,
        );

        const serverMessages = Array.isArray(
          data.messages,
        )
          ? data.messages
          : [];

        const normalizedMessages = serverMessages.map(
          message =>
            normalizeServerMessage(
              message,
              currentUserId,
            ),
        );

        setMessages(current => {
          const serverIds = new Set(
            normalizedMessages.map(message => message._id),
          );
          const pendingLocal = current.filter(
            message =>
              message.sender === 'me' &&
              !serverIds.has(message._id) &&
              String(message._id).startsWith('local-'),
          );

          return [...normalizedMessages, ...pendingLocal].sort(
            (a, b) =>
              new Date(a.createdAt) -
              new Date(b.createdAt),
          );
        });
      } catch (error) {
        onErrorRef.current?.(error);
      }
    },
    [
      contactId,
      currentUserId,
      syncWithServer,
      token,
    ],
  );

  useEffect(() => {
    if (!syncWithServer) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    setMessages([]);
    setCacheHydrated(false);
    hydratedConversationRef.current = null;
    setLoading(true);

    async function hydrateMessages() {
      const cached = await loadCachedMessages(currentUserId, conversationId);
      if (!mounted) return;

      if (cached.length) setMessages(cached);
      hydratedConversationRef.current = conversationId;
      setCacheHydrated(true);
      // Socket.IO keeps this conversation current. Fetch once after the cache
      // has painted instead of blocking the initial chat screen.
      setLoading(false);
      await loadServerMessages();
    }

    hydrateMessages().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [
    conversationId,
    currentUserId,
    loadServerMessages,
    syncWithServer,
  ]);

  useEffect(() => {
    if (cacheHydrated && hydratedConversationRef.current === conversationId) {
      saveCachedMessages(currentUserId, conversationId, messages);
    }
  }, [cacheHydrated, conversationId, currentUserId, messages]);

  useEffect(() => {
    const timers = statusTimers.current;

    return () => {
      timers.forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  const rows = useMemo(
    () => buildRows(messages),
    [messages],
  );

  const animateJumpButton = visible => {
    Animated.timing(jumpOpacity, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const scrollToBottom = useCallback(
    (animated = false) => {
      if (listRef.current) {
        listRef.current.scrollToEnd({
          animated,
        });
      }
    },
    [],
  );

  const handleScroll = event => {
    const {
      contentOffset,
      contentSize,
      layoutMeasurement,
    } = event.nativeEvent;

    const distanceFromBottom =
      contentSize.height -
      contentOffset.y -
      layoutMeasurement.height;

    const visible =
      distanceFromBottom > 140;

    if (visible !== showJump) {
      setShowJump(visible);
      animateJumpButton(visible);
    }

    nearBottom.current =
      distanceFromBottom < 140;
  };

  const appendMessages = nextMessages => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut,
    );

    setMessages(current => [
      ...current,
      ...nextMessages,
    ]);
  };

  const scheduleStatus = messageId => {
    const updateStatus = (
      delay,
      status,
    ) => {
      statusTimers.current.push(
        setTimeout(() => {
          setMessages(current =>
            current.map(item =>
              item._id === messageId
                ? {
                  ...item,
                  status,
                }
                : item,
            ),
          );
        }, delay),
      );
    };

    updateStatus(900, 'delivered');
    updateStatus(2400, 'read');
  };

  const appendOutgoing = partial => {
    const message = {
      ...partial,
      sender: 'me',
      createdAt:
        new Date().toISOString(),
      status: 'sent',
    };

    appendMessages([message]);
    scheduleStatus(message._id);

    return message;
  };

  const replaceMessage = (messageId, nextMessage) => {
    setMessages(current =>
      current.map(item =>
        item._id === messageId ? nextMessage : item,
      ),
    );
  };

  const removeMessage = messageId => {
    setMessages(current =>
      current.filter(item => item._id !== messageId),
    );
  };

  const toggleMessageSelection = messageId => {
    setSelectedMessageIds(current =>
      current.includes(messageId)
        ? current.filter(id => id !== messageId)
        : [...current, messageId],
    );
  };

  const clearMessageSelection = () => setSelectedMessageIds([]);

  const selectedMessage = selectedMessageIds.length === 1
    ? messages.find(message => message._id === selectedMessageIds[0])
    : null;
  const selectedMessages = messages.filter(message =>
    selectedMessageIds.includes(message._id),
  );
  const canDeleteForEveryone = selectedMessages.length > 0 && selectedMessages.every(
    message => message.sender === 'me',
  );
  const canEditSelectedMessage = Boolean(
    selectedMessage &&
    (selectedMessage.type === 'text' || selectedMessage.messageType === 'text'),
  );

  const deleteSelectedMessages = async mode => {
    const selected = messages.filter(message => selectedMessageIds.includes(message._id));
    const deletable = selected;

    if (!deletable.length) {
      Alert.alert('Cannot delete', 'No message selected.');
      return;
    }

    try {
      const serverMessageIds = deletable
        .filter(message => !String(message._id).startsWith('local-'))
        .map(message => message._id);

      if (serverMessageIds.length) {
        await deleteChatMessages(contactId, serverMessageIds, token, mode);
      }

      setMessages(current => current.filter(message => !deletable.some(item => item._id === message._id)));
      clearMessageSelection();
      await loadServerMessages();
    } catch (error) {
      onErrorRef.current?.(error);
    }
  };

  const promptDeleteOptions = () => {
    setDeletePromptVisible(true);
  };

  const startEditingMessage = () => {
    if (selectedMessageIds.length !== 1) return;
    const message = messages.find(item => item._id === selectedMessageIds[0]);
    if (!message || (message.type !== 'text' && message.messageType !== 'text')) {
      Alert.alert('Cannot edit', 'Only text messages can be edited.');
      return;
    }
    setEditingMessage(message);
    setText(message.text || '');
    clearMessageSelection();
  };

  const sendText = async () => {
    const value = text.trim();

    if (!value) {
      return;
    }

    setText('');

    if (syncWithServer) {
      setSendingText(true);
      try {
        if (editingMessage) {
          const saved = await editChatMessage(
            contactId,
            editingMessage._id,
            value,
            token,
          );
          setMessages(current => current.map(message => (
            String(message._id) === String(editingMessage._id)
              ? normalizeServerMessage(saved, currentUserId)
              : message
          )));
          setEditingMessage(null);
          return;
        }

        const saved = await sendChatMessage(
          contactId,
          value,
          token,
        );

        appendMessages([
          normalizeServerMessage(
            saved,
            currentUserId,
          ),
        ]);
      } catch (error) {
        setText(value);
        onErrorRef.current?.(error);
      } finally {
        setSendingText(false);
      }

      return;
    }

    onErrorRef.current?.(new Error('Select a real user before sending a message.'));
  };

  const handlePickerResponse = response => {
    const asset = response.assets?.[0];

    if (asset?.uri) {
      sendImage('', {
        uri: asset.uri,
        previewUri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
        size: asset.fileSize,
        mediaWidth: asset.width,
        mediaHeight: asset.height,
      });
      return;
    }

    if (response.errorMessage) {
      Alert.alert(
        'Could not open picker',
        response.errorMessage,
      );
    }
  };

  const pickFromGallery = () => {
    setAttachmentOpen(false);
    setPendingDocument(null);

    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1440,
        maxHeight: 1440,
        selectionLimit: 1,
      },
      response => {
        if (response.didCancel) {
          setPendingImage(null);
          setPendingDocument(null);
          return;
        }

        handlePickerResponse(response);
      },
    );
  };

  const takeWithCamera = () => {
    setAttachmentOpen(false);
    setPendingDocument(null);

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1440,
        maxHeight: 1440,
        saveToPhotos: false,
      },
      response => {
        if (response.didCancel) {
          setPendingImage(null);
          setPendingDocument(null);
          return;
        }

        if (!response.assets?.[0]?.uri) {
          Alert.alert(
            'Camera unavailable',
            response.errorMessage ||
            'The camera could not be opened.',
          );

          return;
        }

        handlePickerResponse(response);
      },
    );
  };

  const pickDocument = async () => {
    setAttachmentOpen(false);
    setPendingImage(null);

    try {
      const [file] = await pick({
        type: [
          types.pdf,
          types.doc,
          types.docx,
          types.plainText,
          types.csv,
          types.xls,
          types.xlsx,
          types.ppt,
          types.pptx,
          types.zip,
          types.audio,
        ],
      });

      if (!file?.uri) {
        return;
      }

      // Android document providers return content:// URIs. Keep a local copy
      // so the upload receives a readable file path.
      const [localCopy] = await keepLocalCopy({
        files: [{
          uri: file.uri,
          fileName: file.name || `document-${Date.now()}`,
          ...(file.isVirtual && file.convertibleToMimeTypes?.[0]?.mimeType
            ? { convertVirtualFileToType: file.convertibleToMimeTypes[0].mimeType }
            : {}),
        }],
        destination: 'cachesDirectory',
      });

      if (localCopy?.status !== 'success' || !localCopy.localUri) {
        throw new Error(localCopy?.copyError || 'The selected document could not be prepared for review.');
      }

      const selectedFile = {
        ...file,
        uri: localCopy.localUri,
      };

      if (!isDocumentFile(selectedFile)) {
        Alert.alert('Document only', 'Please choose a PDF or another document file, not media.');
        return;
      }

      sendDocument(selectedFile);
    } catch (error) {
      const message = String(
        error?.message || '',
      ).toLowerCase();

      if (!message.includes('cancel')) {
        Alert.alert(
          'Could not pick document',
          error?.message || String(error),
        );
      }
    }
  };

  const sendDocument = async (selectedFile = pendingDocument, resolvedDuration) => {
    const file = selectedFile;
    if (!file?.uri) return;

    const isAudio = String(file.type || '').toLowerCase().startsWith('audio/') ||
      /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(String(file.name || ''));
    const attachmentType = isAudio ? 'audio' : 'document';
    const duration = isAudio
      ? Number(resolvedDuration || file.duration || 0)
      : 0;

    setPendingDocument(null);
    setUploadError('');

    const documentMessage = appendOutgoing({
      _id: makeId(),
      type: attachmentType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      duration,
      attachmentUrl: file.uri,
    });

    if (!syncWithServer) return;

    try {
      setUploadingAttachment(true);
      const saved = await uploadChatAttachment(
        contactId,
        {
          uri: file.uri,
          type: file.type,
          fileName: file.name,
          size: file.size,
        },
        token,
        {
          text: '',
          type: attachmentType,
          duration,
        },
        progress => setUploadProgress(progress),
      );

      // Attachment upload responses can omit client-only fields such as the
      // local URI or file name. Keep those fields when replacing the optimistic
      // bubble, otherwise selection/cancel can leave an empty outgoing card.
      replaceMessage(
        documentMessage._id,
        normalizeServerMessage(
          { ...documentMessage, ...saved },
          currentUserId,
        ),
      );
    } catch (error) {
      removeMessage(documentMessage._id);
      setUploadError(error.message || 'Upload failed.');
      onErrorRef.current?.(error);
    } finally {
      setUploadingAttachment(false);
      setUploadProgress(0);
    }
  };

  const sendImage = async (caption = '', selectedAttachment = pendingImage) => {
    const attachment = selectedAttachment;
    const uri = attachment?.uri;
    const trimmedCaption = String(caption || '').trim();

    if (!uri) {
      return;
    }

    setPendingImage(null);
    setUploadError('');
    const messageType = isVideoAttachment(attachment)
      ? 'video'
      : 'image';

    const optimisticMessage = appendOutgoing({
      _id: makeId(),
      type: messageType,
      imageUrl: attachment.previewUri || uri,
      attachmentUrl: attachment.previewUri || uri,
      caption: trimmedCaption,
      fileName: attachment.fileName,
      fileType: attachment.type,
      fileSize: attachment.size,
      mediaWidth: attachment.mediaWidth,
      mediaHeight: attachment.mediaHeight,
    });

    if (!syncWithServer) {
      return;
    }

    try {
      setUploadingAttachment(true);
      const saved = await uploadChatAttachment(
        contactId,
        attachment,
        token,
      {
          text: trimmedCaption,
          type: messageType,
          caption: trimmedCaption,
          mediaWidth: attachment.mediaWidth,
          mediaHeight: attachment.mediaHeight,
        },
        progress => setUploadProgress(progress),
      );

      replaceMessage(
        optimisticMessage._id,
        normalizeServerMessage(
          { ...optimisticMessage, ...saved },
          currentUserId,
        ),
      );
    } catch (error) {
      removeMessage(optimisticMessage._id);
      setPendingImage(attachment);
      setUploadError(error.message || 'Upload failed.');
      onErrorRef.current?.(error);
    } finally {
      setUploadingAttachment(false);
      setUploadProgress(0);
    }
  };

  const startVoiceRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .RECORD_AUDIO,
            {
              title: 'Microphone permission',
              message:
                'Medi needs microphone access to record voice messages.',
              buttonPositive: 'Allow',
              buttonNegative: 'Cancel',
            },
          );

        if (
          granted !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert(
            'Microphone unavailable',
            'Enable microphone permission in Settings.',
          );

          return;
        }
      } catch (error) {
        Alert.alert(
          'Microphone unavailable',
          error?.message || String(error),
        );

        return;
      }
    }

    setRecordingOpen(true);
  };

  const sendVoiceMessage = async (secondsRecorded, recording, recordedWaveform) => {
    setRecordingOpen(false);

    const voiceMessage = appendOutgoing({
      _id: makeId(),
      type: 'voice',
      duration: secondsRecorded,
      waveform: recordedWaveform?.length
        ? recordedWaveform
        : seededWaveform(`${Date.now()}`),
    });

    if (!syncWithServer) {
      return;
    }

    if (!recording?.uri) {
      removeMessage(voiceMessage._id);
      onErrorRef.current?.(new Error('Voice recording is unavailable.'));
      return;
    }

    try {
      setUploadingAttachment(true);
      const saved = await uploadChatAttachment(
        contactId,
        { ...recording, size: recording.size || 0 },
        token,
        {
          text: '',
          type: 'audio',
          duration: secondsRecorded,
          waveform: voiceMessage.waveform,
        },
        progress => setUploadProgress(progress),
      );
      replaceMessage(
        voiceMessage._id,
        normalizeServerMessage(
          { ...voiceMessage, ...saved },
          currentUserId,
        ),
      );
    } catch (error) {
      removeMessage(voiceMessage._id);
      setUploadError(error.message || 'Upload failed.');
      onErrorRef.current?.(error);
    } finally {
      setUploadingAttachment(false);
      setUploadProgress(0);
    }
  };

  const renderAttachment = message => {
    const messageType = String(message.type || message.messageType || '').toLowerCase();
    const isVideo = messageType === 'video' || String(message.fileType || '').toLowerCase().startsWith('video/');

    if (
      message.type === 'image' ||
      message.type === 'video' ||
      isVideo
    ) {
      return (
        <ImageMessage
          message={message}
          theme={theme}
          token={token}
          onPress={() =>
            selectedMessageIds.length ? null : setViewingImage(message)
          }
        />
      );
    }

    if (
      message.type === 'document' ||
      message.type === 'pdf'
    ) {
      return (
        <DocumentBubble
          message={message}
          theme={theme}
          mine={message.sender === 'me'}
          onPress={() =>
            selectedMessageIds.length
              ? null
              : setViewingDocument({
                ...message,
                uri: message.attachmentUrl || message.uri,
              })
          }
        />
      );
    }

    if (
      messageType === 'voice' ||
      messageType === 'audio' ||
      messageType.startsWith('audio/') ||
      String(message.fileType || '').toLowerCase().startsWith('audio/') ||
      Boolean(message.audioUrl)
    ) {
      return (
        <VoiceMessageBubble
          message={message}
          theme={theme}
          mine={message.sender === 'me'}
          token={token}
        />
      );
    }

    return null;
  };

  const renderItem = ({ item, index }) => {
    if (item.kind === 'day') {
      return (
        <FadeSlideIn index={index} distance={8} style={styles.dayRow}>
          <View
            style={[
              styles.dayPill,
              {
                backgroundColor:
                  theme.separatorBg,
              },
            ]}>
            <Text
              style={[
                styles.dayText,
                {
                  color: theme.separatorText,
                },
              ]}>
              {dayLabel(item.date)}
            </Text>
          </View>
        </FadeSlideIn>
      );
    }

    return (
      <MessageBubble
        index={index}
        message={item.message}
        theme={theme}
        mine={
          item.message.sender === 'me'
        }
        renderAttachment={renderAttachment}
        selected={selectedMessageIds.includes(item.message._id)}
        onLongPress={() => toggleMessageSelection(item.message._id)}
        selectionMode={selectedMessageIds.length > 0}
        onSelect={() => toggleMessageSelection(item.message._id)}
      />
    );
  };

  if (loading) {
    return <ChatSkeleton theme={theme} contact={contact} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }>
      <StatusBar
        barStyle={theme.barStyle}
        backgroundColor={theme.background}
      />

      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}>
        <ChatBackground theme={theme} />

        {selectedMessageIds.length ? (
          <View style={[styles.selectionBar, { backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={clearMessageSelection} accessibilityLabel="Cancel message selection">
              <Text style={[styles.selectionAction, { color: theme.ink }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.selectionCount, { color: theme.ink }]}>
              {selectedMessageIds.length} selected
            </Text>
            <View style={styles.deleteActions}>
              {canEditSelectedMessage ? (
                <TouchableOpacity onPress={startEditingMessage} accessibilityLabel="Edit selected message">
                  <Text style={[styles.selectionAction, { color: theme.primary }]}>Edit</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={promptDeleteOptions} accessibilityLabel="Delete selected messages">
                <Text style={[styles.selectionAction, { color: theme.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ChatHeader
            theme={theme}
            contact={{ ...contact, online: contactOnline, lastSeenAt: contactLastSeen }}
            currentUserId={currentUserId}
            onBack={onBack}
            zegoStatus={zegoStatus}
            onRetryZego={onRetryZego}
          />
        )}

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onScroll={handleScroll}
          onContentSizeChange={() => {
            if (nearBottom.current) {
              scrollToBottom();
            }
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {loading || sendingText ? (
                <ActivityIndicator
                  color={theme.primaryLight}
                />
              ) : null}

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: theme.muted,
                  },
                ]}>
                {loading
                  ? 'Loading messages…'
                  : sendingText
                    ? ''
                    : `No messages yet. Say hello to ${contact.name}!`}
              </Text>
            </View>
          }
        />

        <Animated.View
          pointerEvents={
            showJump ? 'auto' : 'none'
          }
          style={[
            styles.jumpButton,
            {
              opacity: jumpOpacity,
              backgroundColor:
                theme.surfaceAlt,
            },
          ]}>
          <TouchableOpacity
            onPress={() =>
              scrollToBottom(true)
            }
            accessibilityLabel="Scroll to latest">
            <Text
              style={{
                color: theme.primaryLight,
                fontSize: 20,
                fontWeight: '800',
              }}>
              ↓
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View
          style={[
            styles.composer,
            {
              backgroundColor:
                theme.background,
            },
          ]}>
          {editingMessage ? (
            <FadeSlideIn
              from="bottom"
              distance={10}
              style={[
                styles.editingBar,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.line, borderWidth: 1 },
              ]}>
              <Text style={[styles.editingText, { color: theme.primary }]}>Editing message</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessage(null);
                  setText('');
                }}
                accessibilityLabel="Cancel edit">
                <Text style={[styles.editingCancel, { color: theme.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </FadeSlideIn>
          ) : null}
          <TouchableOpacity
            style={[styles.composerButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.line, borderWidth: 1, borderRadius: 14 }]}
            onPress={() =>
              setAttachmentOpen(true)
            }
            accessibilityLabel="Attach a file">
            <PaperclipIcon
              color={theme.primaryLight}
              size={19}
            />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  theme.composerField,
                color: theme.ink,
              },
            ]}
            placeholder={editingMessage ? 'Edit message...' : 'Write a message...'}
            placeholderTextColor={theme.muted}
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={sendText}
          />

          {text.trim() ? (
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    theme.outgoingBase,
                },
              ]}
              onPress={sendText}
              accessibilityLabel="Send message">
              <SendIcon
                color={theme.outgoingInk}
                size={18}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.composerButton}
              onPress={startVoiceRecording}
              accessibilityLabel="Record voice message">
              <MicIcon
                color={theme.muted}
                size={20}
              />
            </TouchableOpacity>
          )}
        </View>

        <AttachmentSheet
          visible={attachmentOpen}
          theme={theme}
          onClose={() =>
            setAttachmentOpen(false)
          }
          onGallery={pickFromGallery}
          onCamera={takeWithCamera}
          onDocument={pickDocument}
        />

        <ImageViewerModal
          visible={Boolean(viewingImage)}
          image={viewingImage}
          theme={theme}
          token={token}
          onClose={() =>
            setViewingImage(null)
          }
        />

        <VoiceRecorderModal
          visible={recordingOpen}
          theme={theme}
          onCancel={() =>
            setRecordingOpen(false)
          }
          onSend={sendVoiceMessage}
          onError={onErrorRef.current}
        />

        <DocumentPreviewModal
          visible={Boolean(viewingDocument)}
          document={viewingDocument}
          theme={theme}
          token={token}
          readOnly
          onCancel={() => setViewingDocument(null)}
        />

        <Modal
          visible={deletePromptVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeletePromptVisible(false)}>
          <View style={styles.deletePromptOverlay}>
            <View style={[styles.deletePromptCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.deletePromptIcon, { backgroundColor: `${theme.danger}22` }]}>
                <Text style={[styles.deletePromptIconText, { color: theme.danger }]}>!</Text>
              </View>

              <Text style={[styles.deletePromptTitle, { color: theme.ink }]}>Delete message?</Text>
              <Text style={[styles.deletePromptText, { color: theme.muted }]}>
                {selectedMessageIds.length > 1
                  ? `You selected ${selectedMessageIds.length} messages.`
                  : canDeleteForEveryone
                    ? 'Choose how you want to delete this message.'
                    : 'This message can only be deleted for you.'}
              </Text>

              {canDeleteForEveryone ? (
                <TouchableOpacity
                  style={[styles.deletePromptPrimary, { backgroundColor: theme.danger }]}
                  onPress={() => {
                    setDeletePromptVisible(false);
                    deleteSelectedMessages('everyone');
                  }}>
                  <Text style={styles.deletePromptPrimaryText}>Delete for everyone</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.deletePromptSecondary, { borderColor: theme.line }]}
                onPress={() => {
                  setDeletePromptVisible(false);
                  deleteSelectedMessages('me');
                }}>
                <Text style={[styles.deletePromptSecondaryText, { color: theme.ink }]}>Delete for me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deletePromptCancel}
                onPress={() => setDeletePromptVisible(false)}>
                <Text style={[styles.deletePromptCancelText, { color: theme.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullPageLoading: {
    flex: 1,
  },

  loadingText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
  },

  skeletonHeader: {
    minHeight: 86,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2B273A',
  },

  skeletonBlock: {
    borderRadius: 10,
  },

  skeletonBack: {
    width: 52,
    height: 18,
  },

  skeletonProfile: {
    flex: 1,
    marginLeft: 20,
  },

  skeletonName: {
    width: 132,
    height: 20,
  },

  skeletonStatus: {
    width: 72,
    height: 12,
    marginTop: 8,
  },

  skeletonHeaderActions: {
    flexDirection: 'row',
    gap: 14,
  },

  skeletonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  skeletonMessages: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  skeletonIncoming: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },

  skeletonOutgoing: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },

  skeletonImage: {
    width: 232,
    height: 150,
    borderRadius: 16,
  },

  skeletonLineShort: {
    width: 116,
    height: 14,
    marginTop: 8,
  },

  skeletonLineMedium: {
    width: 170,
    height: 14,
    marginTop: 8,
  },

  skeletonLineLong: {
    width: 210,
    height: 14,
  },

  skeletonComposer: {
    height: 88,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2B273A',
  },

  skeletonAttach: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  skeletonInput: {
    flex: 1,
    height: 52,
    borderRadius: 26,
  },

  selectionBar: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2B273A',
  },

  selectionAction: {
    fontSize: 15,
    fontWeight: '800',
  },

  selectionCount: {
    fontSize: 16,
    fontWeight: '800',
  },

  editingBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  editingText: {
    fontSize: 12,
    fontWeight: '800',
  },

  editingCancel: {
    fontSize: 12,
    fontWeight: '700',
  },

  deleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  deletePromptOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },

  deletePromptCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  deletePromptIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  deletePromptIconText: {
    fontSize: 30,
    fontWeight: '900',
  },

  deletePromptTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  deletePromptText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  deletePromptPrimary: {
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 13,
  },

  deletePromptPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  deletePromptSecondary: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },

  deletePromptSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },

  deletePromptCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 2,
  },

  deletePromptCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    paddingVertical: 14,
    flexGrow: 1,
  },

  dayRow: {
    alignItems: 'center',
    marginVertical: 10,
  },

  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },

  dayText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  jumpButton: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },

  composerButton: {
    width: 40,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 23,
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 15,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

});
