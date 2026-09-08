import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PermissionsAndroid,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { getChatMessages, sendChatMessage, uploadChatAttachment } from '../services/api';
import { API_BASE_URL } from '../config/apiConfig';
import ImageMessage from './chat/ImageMessage';
import DocumentBubble from './chat/DocumentBubble';
import VoiceMessageBubble, { seededWaveform } from './chat/VoiceMessageBubble';
import VoiceRecorderModal from './chat/VoiceRecorderModal';
import { MicIcon } from './chat/ChatIcons';
import ChatHeader from './chat/ChatHeader';
import RealCallScreen from '../screens/chat/RealCallScreen';
import { createCallSocket } from '../services/callService';
import { getChatTheme } from '../theme/chatTheme';
import {
  loadCachedMessages,
  saveCachedMessages,
} from '../storage/chatStorage';

function idOf(value) {
  if (!value) return '';
  return typeof value === 'object' ? value._id || value.id || '' : value;
}

function normalizeMessage(message) {
  const attachmentUrl = message.attachmentFileId
    ? `${API_BASE_URL}/chat/attachments/${String(message.attachmentFileId)}`
    : message.attachmentUrl || message.imageUrl || '';
  const rawType = message.type || message.messageType || 'text';
  return {
    ...message,
    type: rawType === 'audio' ? 'voice' : rawType,
    imageUrl: attachmentUrl,
    attachmentUrl,
  };
}

export default function ChatThread({ person, user, token, onBack, onError }) {
  const { colorScheme } = useColorScheme();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [themeTransitioning, setThemeTransitioning] = useState(false);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const [online, setOnline] = useState(Boolean(person.online));
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const callSocketRef = useRef(null);
  const didMountRef = useRef(false);
  const currentUserId = user?.id || user?._id;
  const contactId = person?.id || person?._id;
  const conversationId = [currentUserId, contactId].map(String).sort().join('_');
  const chatTheme = useMemo(() => getChatTheme(colorScheme), [colorScheme]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setThemeTransitioning(true);
    transitionOpacity.setValue(0);
    Animated.timing(transitionOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(transitionOpacity, {
        toValue: 0,
        duration: 220,
        delay: 80,
        useNativeDriver: true,
      }).start(() => setThemeTransitioning(false));
    });
  }, [chatTheme.background, transitionOpacity]);

  const refresh = async () => {
    try {
      const data = await getChatMessages(person.id, token);
      setMessages((data.messages || []).map(normalizeMessage));
      setOnline(Boolean(data.user?.online));
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    loadCachedMessages(conversationId).then(cached => {
      if (mounted && cached.length) {
        setMessages(cached);
        setLoading(false);
      }
    });

    refresh().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  useEffect(() => {
    if (conversationId && messages.length) {
      saveCachedMessages(conversationId, messages);
    }
  }, [conversationId, messages]);

  useEffect(() => {
    if (!token || !currentUserId) {
      return undefined;
    }

    const socket = createCallSocket(token);
    callSocketRef.current = socket;

    socket.on('call:incoming', call => {
      if (String(call.fromUserId) !== String(currentUserId)) {
        setIncomingCall(call);
      }
    });

    return () => {
      socket.disconnect();
      callSocketRef.current = null;
    };
  }, [currentUserId, token]);

  async function submit() {
    const value = text.trim();
    if (!value) return;
    setText('');
    try {
      const message = await sendChatMessage(person.id, value, token);
      setMessages(items => [...items, normalizeMessage(message)]);
    } catch (error) {
      setText(value);
      onError(error);
    }
  }

  async function startVoiceRecording() {
    if (Platform.OS === 'android') {
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
        onError(new Error('Microphone permission is required for voice messages.'));
        return;
      }
    }

    setRecordingOpen(true);
  }

  async function sendVoiceMessage(secondsRecorded, recording, recordedWaveform) {
    setRecordingOpen(false);

    if (!recording?.uri) {
      onError(new Error('Voice recording is unavailable.'));
      return;
    }

    try {
      await uploadChatAttachment(
        person.id,
        { ...recording, size: recording.size || 0 },
        token,
        {
          text: '',
          type: 'audio',
          duration: secondsRecorded,
          waveform: recordedWaveform?.length ? recordedWaveform : seededWaveform(`${Date.now()}`),
        },
      );
      await refresh();
    } catch (error) {
      onError(error);
    }
  }

  if (activeCall) {
    return (
      <RealCallScreen
        contact={activeCall.contact}
        token={token}
        callType={activeCall.type}
        incomingCall={activeCall.incomingCall}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  const renderMessage = ({ item }) => {
    const mine = String(idOf(item.sender)) === String(user.id);
    const type = item.type || item.messageType;
    const hasAttachment = type === 'image' || type === 'video';
    return (
      <View className={`my-1 max-w-[82%] rounded-2xl px-4 py-3 ${mine ? 'self-end bg-brand' : 'self-start border border-line bg-surface'}`}>
        {hasAttachment ? <ImageMessage message={item} theme={chatTheme} token={token} /> : null}
        {type === 'document' || type === 'pdf' ? (
          <DocumentBubble
            message={item}
            theme={chatTheme}
            mine={mine}
          />
        ) : null}
        {type === 'voice' || type === 'audio' ? (
          <VoiceMessageBubble
            message={item}
            theme={chatTheme}
            mine={mine}
            token={token}
          />
        ) : null}
        {item.text ? <Text className={mine ? 'text-white' : 'text-ink'}>{item.text}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ChatHeader
        theme={chatTheme}
        contact={{ ...person, online }}
        onBack={onBack}
        onVoiceCall={() => setActiveCall({ type: 'voice', contact: person })}
        onVideoCall={() => setActiveCall({ type: 'video', contact: person })}
      />
      {loading ? (
        <View className="flex-1 px-5 pt-5">
          <View className="mb-4 h-14 w-32 rounded-2xl bg-surface" />
          <View className="mb-3 ml-auto h-20 w-[74%] rounded-2xl bg-brand/90" />
          <View className="mb-3 h-16 w-[68%] rounded-2xl bg-surface" />
          <View className="mb-3 ml-auto h-16 w-[56%] rounded-2xl bg-brand/80" />
          <View className="mt-2 flex-row items-center">
            <ActivityIndicator color={chatTheme.primaryLight} />
            <Text className="ml-3 text-sm font-semibold text-muted">Loading messages...</Text>
          </View>
        </View>
      ) : (
        <FlatList
          className="flex-1 px-5"
          data={messages}
          keyExtractor={(item, index) => String(item._id || index)}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
      <View className="flex-row items-center border-t border-line bg-canvas px-4 py-3">
        <TextInput className="mr-3 h-12 flex-1 rounded-2xl bg-surface px-4 text-ink" placeholder="Write a message..." placeholderTextColor="#817C94" value={text} onChangeText={setText} onSubmitEditing={submit} />
        {text.trim() ? (
          <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-2xl bg-brand" onPress={submit} accessibilityLabel="Send message"><Text className="text-xl text-white">Send</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-2xl" onPress={startVoiceRecording} accessibilityLabel="Record voice message">
            <MicIcon color={chatTheme.muted} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <VoiceRecorderModal
        visible={recordingOpen}
        theme={chatTheme}
        onCancel={() => setRecordingOpen(false)}
        onSend={sendVoiceMessage}
        onError={onError}
      />

      <Modal visible={Boolean(incomingCall)} transparent animationType="fade" onRequestClose={() => setIncomingCall(null)}>
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full rounded-3xl border border-line bg-canvas p-6">
            <Text className="text-xs font-extrabold tracking-[1.4px] text-brand">
              INCOMING {incomingCall?.callType === 'video' ? 'VIDEO' : 'VOICE'} CALL
            </Text>
            <Text className="mt-2 text-2xl font-extrabold text-ink">
              {incomingCall?.fromName || person.name}
            </Text>
            <Text className="mt-2 text-sm text-muted">
              Answer the real WebRTC call?
            </Text>
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center rounded-2xl bg-[#DC2626] py-3"
                onPress={() => {
                  callSocketRef.current?.emit('call:reject', {
                    targetUserId: incomingCall?.fromUserId,
                    callId: incomingCall?.callId,
                    callType: incomingCall?.callType,
                  });
                  setIncomingCall(null);
                }}>
                <Text className="font-extrabold text-white">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-2xl bg-[#47B8A5] py-3"
                onPress={() => {
                  const call = incomingCall;
                  setIncomingCall(null);
                  callSocketRef.current?.disconnect();
                  setActiveCall({
                    type: call.callType,
                    incomingCall: call,
                    contact: {
                      ...person,
                      id: call.fromUserId,
                      name: call.fromName,
                      online: true,
                    },
                  });
                }}>
                <Text className="font-extrabold text-white">Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {themeTransitioning ? (
        <Animated.View
          pointerEvents="none"
          style={{
            opacity: transitionOpacity,
            backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(16,14,22,0.72)',
          }}
          className="absolute inset-0"
        >
          <View className="flex-1 px-5 pt-6">
            <View className="mb-4 h-5 w-28 rounded-full bg-white/40" />
            <View className="mb-3 h-16 w-[78%] rounded-3xl bg-white/25" />
            <View className="mb-3 ml-auto h-14 w-[66%] rounded-3xl bg-white/20" />
            <View className="mb-3 h-16 w-[72%] rounded-3xl bg-white/18" />
          </View>
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
