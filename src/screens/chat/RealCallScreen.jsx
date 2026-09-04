import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

import { chatTheme } from '../../theme/chatTheme';
import { formatDuration } from '../../components/chat/VoiceMessageBubble';
import {
    createCallSocket,
    makeCallId,
} from '../../services/callService';

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

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
}) {
    const theme = chatTheme;

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
    const [error, setError] = useState('');

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

    const finishCall = notifyPeer => {
        if (endedRef.current) {
            return;
        }

        endedRef.current = true;

        if (
            notifyPeer &&
            socketRef.current &&
            peerUserIdRef.current
        ) {
            socketRef.current.emit('call:hangup', {
                targetUserId: peerUserIdRef.current,
                callId: callIdRef.current,
                callType,
            });
        }

        localStreamRef.current
            ?.getTracks?.()
            .forEach(track => track.stop());

        peerRef.current?.close?.();
        socketRef.current?.disconnect?.();

        onEnd?.();
    };

    useEffect(() => {
        let mounted = true;
        let socket;
        let peer;

        const startCall = async () => {
            try {
                const allowed = await requestPermissions(callType);

                if (!allowed) {
                    throw new Error(
                        callType === 'video'
                            ? 'Camera and microphone permission is required.'
                            : 'Microphone permission is required.',
                    );
                }

                const stream =
                    await mediaDevices.getUserMedia({
                        audio: true,
                        video:
                            callType === 'video'
                                ? { facingMode: 'user' }
                                : false,
                    });

                if (!mounted) {
                    stream
                        .getTracks()
                        .forEach(track => track.stop());
                    return;
                }

                localStreamRef.current = stream;
                setLocalStream(stream);

                socket = createCallSocket(token);
                socketRef.current = socket;

                peer = new RTCPeerConnection({
                    iceServers: ICE_SERVERS,
                });

                peerRef.current = peer;

                stream
                    .getTracks()
                    .forEach(track => peer.addTrack(track, stream));

                peer.ontrack = event => {
                    const streamFromPeer =
                        event.streams?.[0];

                    if (streamFromPeer) {
                        setRemoteStream(streamFromPeer);
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

                socket.on('call:unavailable', () => {
                    if (mounted) {
                        setError(
                            'This user is offline or unavailable.',
                        );
                    }
                });

                socket.on('call:rejected', () => {
                    if (mounted) {
                        setError('Call declined.');
                    }
                });

                socket.on('call:hangup', () => {
                    if (mounted) {
                        finishCall(false);
                    }
                });

                socket.on('call:accepted', async data => {
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

                socket.on('webrtc:offer', async data => {
                    if (
                        !mounted ||
                        data.callId !== callIdRef.current
                    ) {
                        return;
                    }

                    peerUserIdRef.current =
                        data.fromUserId ||
                        peerUserIdRef.current;

                    await peer.setRemoteDescription(
                        new RTCSessionDescription(data.offer),
                    );

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

                socket.on('webrtc:answer', async data => {
                    if (
                        !mounted ||
                        data.callId !== callIdRef.current
                    ) {
                        return;
                    }

                    await peer.setRemoteDescription(
                        new RTCSessionDescription(data.answer),
                    );

                    setStatus('connected');
                });

                socket.on(
                    'webrtc:ice-candidate',
                    async data => {
                        if (
                            !mounted ||
                            data.callId !== callIdRef.current ||
                            !data.candidate
                        ) {
                            return;
                        }

                        try {
                            await peer.addIceCandidate(
                                new RTCIceCandidate(
                                    data.candidate,
                                ),
                            );
                        } catch {
                            // Ignore late ICE candidates.
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
            } catch (callError) {
                if (mounted) {
                    setError(
                        callError.message ||
                        'Could not start call.',
                    );

                    Alert.alert(
                        'Call unavailable',
                        callError.message ||
                        'Check camera and microphone permissions.',
                    );
                }
            }
        };

        startCall();

        return () => {
            mounted = false;

            if (!endedRef.current) {
                finishCall(false);
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
        <View style={styles.screen}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={theme.background}
            />

            {callType === 'video' &&
                remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={styles.remoteVideo}
                    objectFit="cover"
                />
            ) : (
                <View style={styles.voiceBackground} />
            )}

            {callType === 'video' &&
                localStream ? (
                <RTCView
                    streamURL={localStream.toURL()}
                    style={styles.localVideo}
                    objectFit="cover"
                    mirror
                />
            ) : null}

            <View style={styles.identity}>
                {!remoteStream ? (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(name)}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.name}>{name}</Text>

                <Text
                    style={[
                        styles.status,
                        error ? styles.error : null,
                    ]}>
                    {statusText}
                </Text>

                {status !== 'connected' && !error ? (
                    <ActivityIndicator
                        color="#FFFFFF"
                        style={styles.loader}
                    />
                ) : null}
            </View>

            <View style={styles.controls}>
                <View style={styles.controlGroup}>
                    <CallButton
                        active={muted}
                        onPress={toggleMute}
                        accessibilityLabel="Mute">
                        <MicIcon
                            color={
                                muted ? '#6C4DF6' : '#FFFFFF'
                            }
                            size={22}
                        />
                    </CallButton>

                    <CallLabel>
                        {muted ? 'Unmute' : 'Mute'}
                    </CallLabel>
                </View>

                {callType === 'video' ? (
                    <View style={styles.controlGroup}>
                        <CallButton
                            active={!cameraOn}
                            onPress={toggleCamera}
                            accessibilityLabel="Camera">
                            <CameraIcon
                                color={
                                    !cameraOn
                                        ? '#6C4DF6'
                                        : '#FFFFFF'
                                }
                                size={22}
                            />
                        </CallButton>

                        <CallLabel>
                            {cameraOn
                                ? 'Camera on'
                                : 'Camera off'}
                        </CallLabel>
                    </View>
                ) : null}

                <View style={styles.controlGroup}>
                    <CallButton
                        accessibilityLabel="Speaker"
                        onPress={() => { }}>
                        <Text style={styles.speaker}>
                            ◉
                        </Text>
                    </CallButton>

                    <CallLabel>Speaker</CallLabel>
                </View>
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
        backgroundColor: '#100E16',
    },
    voiceBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#100E16',
    },
    remoteVideo: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#100E16',
    },
    localVideo: {
        position: 'absolute',
        top: 58,
        right: 16,
        width: 112,
        height: 164,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#211F2B',
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
        backgroundColor: '#6C4DF6',
        marginBottom: 18,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '900',
    },
    name: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
    },
    status: {
        color: 'rgba(255,255,255,0.8)',
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
        color: '#FFFFFF',
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