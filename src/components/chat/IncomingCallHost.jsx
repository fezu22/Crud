import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RealCallScreen from '../../screens/chat/RealCallScreen';
import { createCallSocket, getActiveCallId } from '../../services/callService';
import { getChatTheme } from '../../theme/chatTheme';

// Keep ringing available across tabs, independently of message notifications.
export default function IncomingCallHost({ token, themeMode }) {
  const [call, setCall] = useState(null);
  const [answered, setAnswered] = useState(false);
  const callRef = useRef(null);
  const socketRef = useRef(null);
  const theme = getChatTheme(themeMode);
  const close = () => {
    callRef.current = null;
    setCall(null);
    setAnswered(false);
  };
  useEffect(() => {
    if (!token) return undefined;
    const socket = createCallSocket(token);
    socketRef.current = socket;
    socket.on('call:incoming', incoming => {
      if (!incoming?.callId || !incoming.fromUserId) return;
      if (incoming.callId === callRef.current?.callId) return;
      if (getActiveCallId() || callRef.current) {
        socket.emit('call:reject', { targetUserId: incoming.fromUserId, callId: incoming.callId });
        return;
      }
      callRef.current = incoming;
      setCall(incoming);
      setAnswered(false);
    });
    socket.on('call:hangup', event => {
      if (event?.callId === callRef.current?.callId && String(event.fromUserId) === String(callRef.current.fromUserId)) close();
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  const reject = () => {
    if (callRef.current) socketRef.current?.emit('call:reject', {
      targetUserId: callRef.current.fromUserId, callId: callRef.current.callId,
    });
    close();
  };
  useEffect(() => {
    if (!call || answered) return undefined;
    const timer = setTimeout(() => {
      socketRef.current?.emit('call:reject', { targetUserId: call.fromUserId, callId: call.callId });
      close();
    }, 45000);
    return () => clearTimeout(timer);
  }, [call, answered]);

  return (
    <Modal visible={Boolean(call)} animationType="fade" onRequestClose={reject}>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        {answered && call ? (
          <RealCallScreen key={call.callId} token={token} incomingCall={call}
            contact={{ id: call.fromUserId, name: call.fromName }}
            callType={call.callType === 'video' ? 'video' : 'voice'} themeMode={themeMode} onEnd={close} />
        ) : (
          <View style={styles.ringing}>
            <View style={[styles.avatar, { backgroundColor: theme.separatorBg }]}>
              <Text style={[styles.initial, { color: theme.primaryLight }]}>{String(call?.fromName || 'U').slice(0, 1)}</Text>
            </View>
            <Text style={[styles.name, { color: theme.ink }]}>{call?.fromName || 'Medi user'}</Text>
            <Text style={{ color: theme.muted }}>Incoming {call?.callType === 'video' ? 'video' : 'voice'} call</Text>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityLabel="Decline call" onPress={reject} style={[styles.button, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.decline}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Answer call" onPress={() => setAnswered(true)} style={[styles.button, { backgroundColor: theme.outgoingBase }]}>
                <Text style={{ color: theme.outgoingInk, fontWeight: '800' }}>Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, ringing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  initial: { fontSize: 36, fontWeight: '800' }, name: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 24, marginTop: 48 }, button: { paddingHorizontal: 28, paddingVertical: 18, borderRadius: 20 },
  decline: { color: '#FFFFFF', fontWeight: '800' },
});
