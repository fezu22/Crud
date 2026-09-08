import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    NativeModules,
    PermissionsAndroid,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    mediaDevices,
} from 'react-native-webrtc';

import CallButton, {
    CallLabel,
} from '../../components/chat/CallButton';

import {
    CameraIcon,
    MicIcon,
    PhoneIcon,
} from '../../components/chat/ChatIcons';

import { getChatTheme } from '../../theme/chatTheme';
import { formatDuration } from '../../components/chat/VoiceMessageBubble';
import {
    createCallSocket,
    makeCallId,
    getIceServers,
    setActiveCallId,
    disconnectAfterSignal,
} from '../../services/callService';

function getInitials(name) {
    return String(name || 'User')
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

async function requestPermissions(callType) {
    if (Platform.OS !== 'android') {
        return true;
    }

    const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ];

    if (callType === 'video') {
        permissions.push(
            PermissionsAndroid.PERMISSIONS.CAMERA,
        );
    }

    const result =
        await PermissionsAndroid.requestMultiple(permissions);

    return permissions.every(
        permission =>
            result[permission] ===
            PermissionsAndroid.RESULTS.GRANTED,
    );
}

export default function RealCallScreen({
    contact,
    token,
    callType = 'voice',
    incomingCall,
    onEnd,
    themeMode = 'dark',
}) {
    const theme = getChatTheme(themeMode);

    const [status, setStatus] = useState(
        incomingCall ? 'connecting' : 'calling',
    );
    const [seconds, setSeconds] = useState(0);
    const [muted, setMuted] = useState(false);
    const [cameraOn, setCameraOn] = useState(
        callType === 'video',
    );
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [remoteVideoKey, setRemoteVideoKey] = useState('');
    const [error, setError] = useState('');
    const [speakerOn, setSpeakerOn] = useState(callType === 'video');
    const connectTimerRef = useRef(null);

    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const endedRef = useRef(false);

    const callIdRef = useRef(
        incomingCall?.callId || makeCallId(),
    );

    const peerUserIdRef = useRef(
        incomingCall?.fromUserId ||
        contact?.id ||
        contact?._id ||
        '',
    );

    const finishCall = (notifyPeer, notifyParent = true) => {
        if (endedRef.current) {
            return;
        }

        endedRef.current = true;
        clearTimeout(connectTimerRef.current);
        NativeModules.BluetoothAudioRoute?.stopCallAudio?.();
        setActiveCallId(null);

        if (
            notifyPeer &&
            socketRef.current &&
            peerUserIdRef.current
        ) {
            disconnectAfterSignal(socketRef.current, 'call:hangup', {
                targetUserId: peerUserIdRef.current,
                callId: callIdRef.current,
                callType,
            });
        }

        localStreamRef.current
            ?.getTracks?.()
            .forEach(track => track.stop());

        peerRef.current?.close?.();
        if (!notifyPeer) socketRef.current?.disconnect?.();

        if (notifyParent) onEnd?.();
    };

    useEffect(() => {
        let mounted = true;
        const socket = createCallSocket(token);
        socketRef.current = socket;
        let peer;
        const pendingCandidates = [];
        let remoteReady = false;
        let signalChain = Promise.resolve();
        setActiveCallId(callIdRef.current);
        const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
            finishCall(true);
            return true;
        });
        const matches = data => mounted && !endedRef.current && data?.callId === callIdRef.current &&
            (!data.fromUserId || String(data.fromUserId) === String(peerUserIdRef.current));
        const fail = callError => {
            if (!mounted || endedRef.current) return;
            Alert.alert('Call unavailable', callError.message || 'Could not connect. Please try again.');
            finishCall(true);
        };
        socket.on('call:hangup', data => { if (matches(data)) finishCall(false); });
        socket.on('call:rejected', data => { if (matches(data)) finishCall(false); });
        socket.on('call:unavailable', data => {
            if (matches(data)) fail(new Error('This user is offline or unavailable.'));
        });
        connectTimerRef.current = setTimeout(() => fail(new Error('No connection after 60 seconds. Please try again.')), 60000);
        const setRemote = async description => {
            await peer.setRemoteDescription(new RTCSessionDescription(description));
            remoteReady = true;
            while (pendingCandidates.length) {
                await peer.addIceCandidate(new RTCIceCandidate(pendingCandidates.shift()));
            }
        };

        const startCall = async () => {
            try {
                const iceServers = await getIceServers(token);
                if (!mounted || endedRef.current) return;
                const allowed = await requestPermissions(callType);
                if (!mounted || endedRef.current) return;

                if (!allowed) {
                    throw new Error(
                        callType === 'video'
                            ? 'Camera and microphone permission is required.'
                            : 'Microphone permission is required.',
                    );
                }

                const stream =
                    await mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                            channelCount: 1,
                        },
                      video:
  callType === 'video'
    ? {
        frameRate: 30,
        facingMode: 'user',
      }
    : false,
                    });

                if (!mounted || endedRef.current) {
                    stream
                        .getTracks()
                        .forEach(track => track.stop());
                    return;
                }

                localStreamRef.current = stream;
                NativeModules.BluetoothAudioRoute?.setCallSpeaker?.(callType === 'video');
                setLocalStream(stream);

                peer = new RTCPeerConnection({
                    iceServers,
                });

                peerRef.current = peer;

                stream
                    .getTracks()
                    .forEach(track => peer.addTrack(track, stream));

                const combinedRemoteStream = new MediaStream();
                const handleRemoteStream = event => {
                    if (!mounted || endedRef.current) return;
                    if (event.track && !combinedRemoteStream.getTracks().some(track => track.id === event.track.id)) {
                        combinedRemoteStream.addTrack(event.track);
                    }
                    const streamFromPeer =
                        event.streams?.[0] ||
                        event.stream ||
                        (event.track
                            ? combinedRemoteStream
                            : null);

                    if (streamFromPeer) {
                        const videoTracks = streamFromPeer.getTracks().filter(track => track.kind === 'video');
                        if (videoTracks.length) {
                            setRemoteStream(streamFromPeer);
                            // Android ignores an unchanged streamURL. Remount when
                            // video arrives after audio or the video track changes.
                            setRemoteVideoKey(`${streamFromPeer.toURL()}:${videoTracks.map(track => track.id).join(',')}`);
                        }
                    }
                };

peer.ontrack = handleRemoteStream;
peer.onaddstream = handleRemoteStream;

peer.onconnectionstatechange = () => {
    if (!mounted || endedRef.current) return;
    if (['connected', 'completed'].includes(peer.connectionState)) {
        clearTimeout(connectTimerRef.current);
        setStatus('connected');
    } else if (peer.connectionState === 'failed') {
        fail(new Error('Video connection failed. Check your network and the server TURN relay configuration.'));
    }
};

peer.oniceconnectionstatechange = () => {
    if (!mounted || endedRef.current) return;
    if (['connected', 'completed'].includes(peer.iceConnectionState)) {
        clearTimeout(connectTimerRef.current);
        setStatus('connected');
    }
};

                peer.onicecandidate = event => {
                    if (
                        event.candidate &&
                        peerUserIdRef.current
                    ) {
                        socket.emit(
                            'webrtc:ice-candidate',
                            {
                                targetUserId:
                                    peerUserIdRef.current,
                                callId: callIdRef.current,
                                candidate: event.candidate,
                            },
                        );
                    }
                };

                socket.on('connect_error', socketError => {
                    if (mounted) {
                        setError(
                            socketError.message ||
                            'Call server connection failed.',
                        );
                    }
                });

                const onSignal = (event, handler) => socket.on(event, data => {
                    if (!matches(data)) return;
                    signalChain = signalChain.then(() => {
                        if (matches(data)) return handler(data);
                        return undefined;
                    }).catch(fail);
                });
                onSignal('call:accepted', async data => {
                    if (
                        !mounted ||
                        data.callId !== callIdRef.current
                    ) {
                        return;
                    }

                    setStatus('connecting');

                    const offer =
                        await peer.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo:
                                callType === 'video',
                        });

                    await peer.setLocalDescription(offer);

                    socket.emit('webrtc:offer', {
                        targetUserId:
                            peerUserIdRef.current,
                        callId: callIdRef.current,
                        offer,
                        callType,
                    });
                });

                onSignal('webrtc:offer', async data => {
                    if (
                        !mounted ||
                        data.callId !== callIdRef.current
                    ) {
                        return;
                    }

                    peerUserIdRef.current =
                        data.fromUserId ||
                        peerUserIdRef.current;

                    await setRemote(data.offer);

                    const answer =
                        await peer.createAnswer();

                    await peer.setLocalDescription(answer);

                    socket.emit('webrtc:answer', {
                        targetUserId:
                            peerUserIdRef.current,
                        callId: callIdRef.current,
                        answer,
                        callType,
                    });

                    setStatus('connecting');
                });

                onSignal('webrtc:answer', async data => {
                    if (
                        !mounted ||
                        data.callId !== callIdRef.current
                    ) {
                        return;
                    }

                    await setRemote(data.answer);
                });

                onSignal(
                    'webrtc:ice-candidate',
                    async data => {
                        if (
                            !mounted ||
                            data.callId !== callIdRef.current ||
                            !data.candidate
                        ) {
                            return;
                        }

                        if (!remoteReady) {
                            pendingCandidates.push(data.candidate);
                            return;
                        }
                        try {
                            await peer.addIceCandidate(
                                new RTCIceCandidate(
                                    data.candidate,
                                ),
                            );
                        } catch (candidateError) {
                            if (!endedRef.current) throw candidateError;
                        }
                    },
                );

                if (incomingCall) {
                    socket.emit('call:accept', {
                        targetUserId:
                            incomingCall.fromUserId,
                        callId: callIdRef.current,
                        callType,
                    });
                } else {
                    socket.emit('call:invite', {
                        targetUserId:
                            peerUserIdRef.current,
                        callId: callIdRef.current,
                        callType,
                    });
                }
            } catch (callError) { fail(callError); }
        };

        startCall();

        return () => {
            mounted = false;
            clearTimeout(connectTimerRef.current);
            backSubscription.remove();

            if (!endedRef.current) {
                finishCall(true, false);
            }
        };

        // Call initialization should run once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (status !== 'connected') {
            return undefined;
        }

        const timer = setInterval(() => {
            setSeconds(value => value + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    const toggleMute = () => {
        const nextValue = !muted;

        localStreamRef.current
            ?.getAudioTracks?.()
            .forEach(track => {
                track.enabled = !nextValue;
            });

        setMuted(nextValue);
    };

    const toggleCamera = () => {
        const nextValue = !cameraOn;

        localStreamRef.current
            ?.getVideoTracks?.()
            .forEach(track => {
                track.enabled = nextValue;
            });

        setCameraOn(nextValue);
    };

    const name =
        contact?.name ||
        incomingCall?.fromName ||
        'Medi user';

    const statusText = error
        ? error
        : status === 'calling'
            ? 'Calling…'
            : status === 'connected'
                ? `Connected · ${formatDuration(seconds)}`
                : 'Connecting…';

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.barStyle}
                backgroundColor={theme.background}
            />

            {callType === 'video' &&
                remoteStream ? (
                <RTCView
                    key={remoteVideoKey}
                    testID="remote-call-video"
                    streamURL={remoteStream.toURL()}
                    style={styles.remoteVideo}
                    objectFit="cover"
                    zOrder={0}
                />
            ) : ( 
                <View style={[styles.voiceBackground, { backgroundColor: theme.background }]} />
            )}

            {callType === 'video' &&
                localStream && cameraOn ? (
                <RTCView
                    testID="local-call-video"
                    streamURL={localStream.toURL()}
                    style={styles.localVideo}
                    objectFit="cover"
                    mirror
                    zOrder={1}
                />
            ) : null}

            <View style={styles.identity}>
                {!remoteStream ? (
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>
                            {getInitials(name)}
                        </Text>
                    </View>
                ) : null}

                <Text style={[styles.name, { color: theme.ink }]}>{name}</Text>

                <Text
                    style={[
                        styles.status,
                        { color: theme.muted },
                        error ? styles.error : null,
                    ]}>
                    {statusText}
                </Text>
                {callType === 'video' && status === 'connected' && !remoteStream ? (
                    <Text style={[styles.status, { color: theme.muted }]}>Waiting for the other person's camera...</Text>
                ) : null}

                {status !== 'connected' && !error ? (
                    <ActivityIndicator
                        color={theme.primary}
                        style={styles.loader}
                    />
                ) : null}
            </View>

            <View style={styles.controls}>
                <View style={styles.controlGroup}>
                    <CallButton
                        active={muted}
                        activeColor={theme.surface}
                        inactiveColor={theme.surfaceAlt}
                        onPress={toggleMute}
                        accessibilityLabel="Mute">
                        <MicIcon
                            color={
                                muted ? theme.primary : theme.ink
                            }
                            size={22}
                        />
                    </CallButton>

                    <CallLabel color={theme.muted}>
                        {muted ? 'Unmute' : 'Mute'}
                    </CallLabel>
                </View>

                {callType === 'video' ? (
                    <View style={styles.controlGroup}>
                        <CallButton
                            active={!cameraOn}
                            activeColor={theme.surface}
                            inactiveColor={theme.surfaceAlt}
                            onPress={toggleCamera}
                            accessibilityLabel="Camera">
                            <CameraIcon
                                color={
                                    !cameraOn
                                        ? theme.primary
                                        : theme.ink
                                }
                                size={22}
                            />
                        </CallButton>

                        <CallLabel color={theme.muted}>
                            {cameraOn
                                ? 'Camera on'
                                : 'Camera off'}
                        </CallLabel>
                    </View>
                ) : null}

                {Platform.OS === 'android' && NativeModules.BluetoothAudioRoute?.setCallSpeaker ? <View style={styles.controlGroup}>
                    <CallButton
                        accessibilityLabel="Speaker"
                        active={speakerOn}
                        activeColor={theme.primary}
                        inactiveColor={theme.surfaceAlt}
                        onPress={() => {
                            NativeModules.BluetoothAudioRoute.setCallSpeaker(!speakerOn);
                            setSpeakerOn(!speakerOn);
                        }}>
                        <Text style={[styles.speaker, { color: theme.ink }]}>
                            ◉
                        </Text>
                    </CallButton>

                    <CallLabel color={theme.muted}>{speakerOn ? 'Speaker on' : 'Speaker off'}</CallLabel>
                </View> : null}
            </View>

            <View style={styles.endRow}>
                <TouchableOpacity
                    style={styles.endButton}
                    onPress={() => finishCall(true)}
                    accessibilityLabel="End call">
                    <View
                        style={{
                            transform: [{ rotate: '135deg' }],
                        }}>
                        <PhoneIcon
                            color="#FFFFFF"
                            size={24}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        overflow: 'hidden',
    },
    voiceBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    remoteVideo: {
        ...StyleSheet.absoluteFillObject,
    },
    localVideo: {
        position: 'absolute',
        top: 58,
        right: 16,
        width: 112,
        height: 164,
        borderRadius: 18,
        overflow: 'hidden',
    },
    identity: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 70,
    },
    avatar: {
        width: 118,
        height: 118,
        borderRadius: 59,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '900',
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
    },
    status: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    error: {
        color: '#FCA5A5',
    },
    loader: {
        marginTop: 14,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 22,
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    controlGroup: {
        alignItems: 'center',
    },
    speaker: {
        fontSize: 18,
        fontWeight: '900',
    },
    endRow: {
        alignItems: 'center',
        paddingBottom: 34,
    },
    endButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
