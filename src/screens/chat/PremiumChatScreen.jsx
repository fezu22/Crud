import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import AttachmentSheet from '../../components/chat/AttachmentSheet';
import ChatBackground from '../../components/chat/ChatBackground';
import ChatHeader from '../../components/chat/ChatHeader';
import DocumentBubble from '../../components/chat/DocumentBubble';
import ImageMessage from '../../components/chat/ImageMessage';
import ImagePreviewModal from '../../components/chat/ImagePreviewModal';
import ImageViewerModal from '../../components/chat/ImageViewerModal';
import MessageBubble from '../../components/chat/MessageBubble';
import VoiceMessageBubble, { seededWaveform } from '../../components/chat/VoiceMessageBubble';
import VoiceRecorderModal from '../../components/chat/VoiceRecorderModal';
import { MicIcon, PaperclipIcon, SendIcon } from '../../components/chat/ChatIcons';
import { chatTheme } from '../../theme/chatTheme';
import { farazContact, makeId, nextReply } from './mockChatData';
import VoiceCallScreen from './VoiceCallScreen';
import VideoCallScreen from './VideoCallScreen';

function sameDay(a, b) {
  if (!b) return false;
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function dayLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function buildRows(messages) {
  const rows = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    if (!previous || !sameDay(previous.createdAt, message.createdAt)) {
      rows.push({ kind: 'day', id: `day-${message._id}`, date: message.createdAt });
    }
    rows.push({ kind: 'message', id: message._id, message });
  });
  return rows;
}

/**
 * Faraz chat screen: purple outgoing bubbles, dark incoming bubbles,
 * timestamps with sent/delivered/read ticks, image/document/voice sharing
 * and mock voice/video calls. Rendered inside the Chat tab so the app's
 * bottom navigation stays in place.
 */
export default function PremiumChatScreen({ contact = farazContact, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showJump, setShowJump] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // null | 'voice' | 'video'
  const replyCount = useRef(0);
  const statusTimers = useRef([]);
  const listRef = useRef(null);
  const nearBottom = useRef(true);
  const jumpOpacity = useRef(new Animated.Value(0)).current;
  const theme = chatTheme;

  useEffect(
    () => () => {
      statusTimers.current.forEach(timer => clearTimeout(timer));
    },
    [],
  );

  const rows = useMemo(() => buildRows(messages), [messages]);

  const animateJumpButton = visible => {
    Animated.timing(jumpOpacity, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const scrollToBottom = useCallback((animated = false) => {
    if (listRef.current) listRef.current.scrollToEnd({ animated });
  }, []);

  const handleScroll = event => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    const visible = distanceFromBottom > 140;
    if (visible !== showJump) {
      setShowJump(visible);
      animateJumpButton(visible);
    }
    nearBottom.current = distanceFromBottom < 140;
  };

  // Call screens replace the chat view; kept after every hook so the hook
  // order stays stable across renders.
  if (activeCall === 'voice') {
    return <VoiceCallScreen contact={contact} onEnd={() => setActiveCall(null)} />;
  }
  if (activeCall === 'video') {
    return <VideoCallScreen contact={contact} onEnd={() => setActiveCall(null)} />;
  }

  const appendMessages = next => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(current => [...current, ...next]);
  };

  const scheduleStatus = messageId => {
    const set = (delay, status) => {
      statusTimers.current.push(
        setTimeout(() => {
          setMessages(current =>
            current.map(item =>
              item._id === messageId ? { ...item, status } : item,
            ),
          );
        }, delay),
      );
    };
    set(900, 'delivered');
    set(2400, 'read');
  };

  const scheduleReply = () => {
    const replyAt = replyCount.current;
    replyCount.current += 1;
    statusTimers.current.push(
      setTimeout(() => {
        appendMessages([
          {
            _id: makeId(),
            type: 'text',
            text: nextReply(replyAt),
            sender: 'them',
            createdAt: new Date().toISOString(),
            status: 'read',
          },
        ]);
      }, 3200),
    );
  };

  const appendOutgoing = partial => {
    const message = {
      ...partial,
      sender: 'me',
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    appendMessages([message]);
    scheduleStatus(message._id);
    return message;
  };

  const sendText = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    appendOutgoing({ _id: makeId(), type: 'text', text: value });
    scheduleReply();
  };

  const handlePickerResponse = response => {
    const asset = response.assets?.[0];
    if (asset?.uri) {
      setPendingImage({ uri: asset.uri, fileName: asset.fileName });
      return;
    }
    if (response.errorMessage) {
      Alert.alert('Could not open picker', response.errorMessage);
    }
  };

  const pickFromGallery = () => {
    setAttachmentOpen(false);
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 1440, maxHeight: 1440, selectionLimit: 1 },
      response => {
        if (response.didCancel) return;
        handlePickerResponse(response);
      },
    );
  };

  const takeWithCamera = () => {
    setAttachmentOpen(false);
    launchCamera(
      { mediaType: 'photo', quality: 0.8, maxWidth: 1440, maxHeight: 1440, saveToPhotos: false },
      response => {
        if (response.didCancel) return;
        if (!response.assets?.[0]?.uri) {
          Alert.alert(
            'Camera unavailable',
            response.errorMessage ||
              'The camera could not be opened on this device. Try the gallery instead.',
          );
          return;
        }
        handlePickerResponse(response);
      },
    );
  };

  const pickDocument = async () => {
    setAttachmentOpen(false);
    try {
      const [file] = await pick({ type: [types.pdf, types.allFiles] });
      if (!file?.uri) return;
      appendOutgoing({
        _id: makeId(),
        type: 'document',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      scheduleReply();
    } catch (error) {
      // The document picker throws when the user cancels; ignore that case.
      if (!String(error?.message || '').toLowerCase().includes('cancel')) {
        Alert.alert('Could not pick document', error?.message || String(error));
      }
    }
  };

  const sendImage = caption => {
    const uri = pendingImage?.uri;
    if (!uri) return;
    setPendingImage(null);
    appendOutgoing({ _id: makeId(), type: 'image', imageUrl: uri, caption });
    scheduleReply();
  };

  const startVoiceRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone permission',
            message: 'Medi needs microphone access to record voice messages.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Microphone unavailable',
            'Voice messages need microphone access. Enable it in Settings to record.',
          );
          return;
        }
      } catch (error) {
        Alert.alert('Microphone unavailable', error?.message || String(error));
        return;
      }
    }
    setRecordingOpen(true);
  };

  const sendVoiceMessage = seconds => {
    setRecordingOpen(false);
    appendOutgoing({
      _id: makeId(),
      type: 'voice',
      duration: seconds,
      waveform: seededWaveform(`${Date.now()}`),
    });
    scheduleReply();
  };

  const renderAttachment = message => {
    if (message.type === 'image') {
      return (
        <ImageMessage
          message={message}
          theme={theme}
          onPress={() => setViewingImage(message)}
        />
      );
    }
    if (message.type === 'document' || message.type === 'pdf') {
      return (
        <DocumentBubble message={message} theme={theme} mine={message.sender === 'me'} />
      );
    }
    if (message.type === 'voice') {
      return <VoiceMessageBubble message={message} theme={theme} mine={message.sender === 'me'} />;
    }
    return null;
  };

  const renderItem = ({ item }) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.dayRow}>
          <View style={[styles.dayPill, { backgroundColor: theme.separatorBg }]}>
            <Text style={[styles.dayText, { color: theme.separatorText }]}>
              {dayLabel(item.date)}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <MessageBubble
        message={item.message}
        theme={theme}
        mine={item.message.sender === 'me'}
        renderAttachment={renderAttachment}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={theme.barStyle} backgroundColor={theme.background} />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ChatBackground theme={theme} />
        <ChatHeader
          theme={theme}
          contact={contact}
          onBack={onBack}
          onVoiceCall={() => setActiveCall('voice')}
          onVideoCall={() => setActiveCall('video')}
        />

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onScroll={handleScroll}
          onContentSizeChange={() => {
            if (nearBottom.current) scrollToBottom();
          }}
          scrollEventThrottle={60}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                No messages yet. Say hello to {contact.name}!
              </Text>
            </View>
          }
        />

        <Animated.View
          pointerEvents={showJump ? 'auto' : 'none'}
          style={[styles.jumpButton, { opacity: jumpOpacity, backgroundColor: theme.surfaceAlt }]}>
          <TouchableOpacity onPress={() => scrollToBottom(true)} accessibilityLabel="Scroll to latest">
            <Text style={{ color: theme.primaryLight, fontSize: 20, fontWeight: '800' }}>↓</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.composer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={styles.composerButton}
            onPress={() => setAttachmentOpen(true)}
            hitSlop={4}
            accessibilityLabel="Attach a file">
            <PaperclipIcon color={theme.muted} size={19} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.composerField, color: theme.ink },
            ]}
            placeholder="Write a message..."
            placeholderTextColor={theme.muted}
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={sendText}
          />
          {text.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={sendText}
              accessibilityLabel="Send message">
              <SendIcon color="#FFFFFF" size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.composerButton}
              onPress={startVoiceRecording}
              hitSlop={4}
              accessibilityLabel="Record voice message">
              <MicIcon color={theme.muted} size={20} />
            </TouchableOpacity>
          )}
        </View>

        <AttachmentSheet
          visible={attachmentOpen}
          theme={theme}
          onClose={() => setAttachmentOpen(false)}
          onGallery={pickFromGallery}
          onCamera={takeWithCamera}
          onDocument={pickDocument}
        />
        <ImagePreviewModal
          visible={!!pendingImage}
          image={pendingImage}
          theme={theme}
          onCancel={() => setPendingImage(null)}
          onSend={sendImage}
        />
        <ImageViewerModal
          visible={!!viewingImage}
          image={viewingImage}
          theme={theme}
          onClose={() => setViewingImage(null)}
        />
        <VoiceRecorderModal
          visible={recordingOpen}
          theme={theme}
          onCancel={() => setRecordingOpen(false)}
          onSend={sendVoiceMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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
