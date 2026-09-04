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
import { CameraIcon, MicIcon, PaperclipIcon, SendIcon } from '../../components/chat/ChatIcons';
import { chatThemes } from '../../theme/chatTheme';
import { buildSeedMessages, drAhmadContact, makeId, nextReply } from './mockChatData';

const EMOJIS = ['😊', '❤️', '👍', '🙏', '😮', '😢', '🩺', '💊'];

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

/**
 * Builds the FlatList rows: messages interleaved with day separators.
 */
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
 * Premium demo conversation with Dr. Ahmad. Real text chat with Medi users
 * still flows through ChatThread; this screen demonstrates the full chat
 * design and works standalone with local state.
 */
export default function PremiumChatScreen({
  contact = drAhmadContact,
  onBack,
  onVoiceCall,
  onVideoCall,
}) {
  const [themeMode, setThemeMode] = useState('dark');
  const [messages, setMessages] = useState(buildSeedMessages);
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const replyCount = useRef(0);
  const statusTimers = useRef([]);
  const listRef = useRef(null);
  const nearBottom = useRef(true);
  const jumpOpacity = useRef(new Animated.Value(0)).current;
  const theme = chatThemes[themeMode];

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

  const sendText = () => {
    const value = text.trim();
    if (!value) return;
    setEmojiOpen(false);
    setText('');
    const outgoingId = makeId();
    appendMessages([
      {
        _id: outgoingId,
        type: 'text',
        text: value,
        sender: 'me',
        createdAt: new Date().toISOString(),
        status: 'sent',
      },
    ]);
    scheduleStatus(outgoingId);
    scheduleReply();
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
      <StatusBar
        barStyle={theme.barStyle}
        backgroundColor={theme.surface}
      />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ChatBackground theme={theme} />
        <ChatHeader
          theme={theme}
          contact={contact}
          onBack={onBack}
          onToggleTheme={() => setThemeMode(mode => (mode === 'dark' ? 'light' : 'dark'))}
          onMore={() => setMenuOpen(open => !open)}
          onVoiceCall={onVoiceCall}
          onVideoCall={onVideoCall}
        />

        {menuOpen ? (
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <MenuItem label="View contact" theme={theme} onPress={() => setMenuOpen(false)} />
            <MenuItem
              label="Clear conversation"
              danger
              theme={theme}
              onPress={() => {
                setMenuOpen(false);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages([]);
              }}
            />
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onScroll={handleScroll}
          onContentSizeChange={() => {
            if (nearBottom.current) scrollToBottom();
          }}
          onLayout={() => scrollToBottom()}
          scrollEventThrottle={60}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                Start the conversation
              </Text>
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                Send a message to {contact.name}. It stays on this device as a
                demo.
              </Text>
            </View>
          }
        />

        <Animated.View
          pointerEvents={showJump ? 'auto' : 'none'}
          style={[styles.jumpButton, { opacity: jumpOpacity, backgroundColor: theme.surfaceAlt }]}>
          <TouchableOpacity onPress={() => scrollToBottom(true)} accessibilityLabel="Scroll to latest">
            <Text style={{ color: theme.greenLight, fontSize: 20, fontWeight: '800' }}>↓</Text>
          </TouchableOpacity>
        </Animated.View>

        {emojiOpen ? (
          <View style={[styles.emojiStrip, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            {EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiCell}
                onPress={() => setText(current => current + emoji)}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View
          style={[
            styles.composer,
            { backgroundColor: theme.surface, borderTopColor: theme.line },
          ]}>
          <ComposerButton onPress={() => setEmojiOpen(open => !open)} theme={theme}>
            <Text style={{ fontSize: 19 }}>{emojiOpen ? '✕' : '😊'}</Text>
          </ComposerButton>
          <ComposerButton
            onPress={() => setAttachmentOpen(true)}
            theme={theme}
            accessibilityLabel="Attach a file">
            <PaperclipIcon color={theme.muted} size={19} />
          </ComposerButton>
          <ComposerButton onPress={takeWithCamera} theme={theme} accessibilityLabel="Take a photo">
            <CameraIcon color={theme.muted} size={19} />
          </ComposerButton>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.composerField,
                borderColor: theme.line,
                color: theme.ink,
              },
            ]}
            placeholder="Write a message…"
            placeholderTextColor={theme.muted}
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={sendText}
          />
          {text.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.green }]}
              onPress={sendText}
              accessibilityLabel="Send message">
              <SendIcon color="#FFFFFF" size={19} />
            </TouchableOpacity>
          ) : (
            <ComposerButton onPress={startVoiceRecording} theme={theme} accessibilityLabel="Record voice message">
              <MicIcon color={theme.muted} size={20} />
            </ComposerButton>
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

function ComposerButton({ children, onPress, theme, accessibilityLabel }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.composerButton}
      hitSlop={4}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  );
}

function MenuItem({ label, onPress, theme, danger }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      hitSlop={4}>
      <Text style={{ color: danger ? theme.danger : theme.ink, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
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
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  jumpButton: {
    position: 'absolute',
    right: 16,
    bottom: 96,
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
  menu: {
    position: 'absolute',
    top: 64,
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    elevation: 8,
    zIndex: 20,
    minWidth: 190,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  emojiStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emojiCell: {
    padding: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  composerButton: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    marginHorizontal: 2,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
