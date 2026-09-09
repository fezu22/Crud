import { ChannelProfileType, ClientRoleType, createAgoraRtcEngine } from 'react-native-agora';

export function createAgoraEngine(appId) { const engine = createAgoraRtcEngine(); engine.initialize({ appId }); engine.enableAudio(); engine.enableVideo(); return engine; }
export function joinAgoraChannel(engine, token, channelName, uid, video) { return engine.joinChannel(token, channelName, uid, { channelProfile: ChannelProfileType.ChannelProfileCommunication, clientRoleType: ClientRoleType.ClientRoleBroadcaster, publishMicrophoneTrack: true, publishCameraTrack: video, autoSubscribeAudio: true, autoSubscribeVideo: video }); }
export function leaveAgoraChannel(engine) { try { engine?.leaveChannel(); } catch (e) { console.warn('[Agora] leave failed', e); } }
export function destroyAgoraEngine(engine) { try { engine?.release(); } catch (e) { console.warn('[Agora] release failed', e); } }
export const muteAgoraAudio = (engine, mute) => engine?.muteLocalAudioStream(mute);
export const muteAgoraVideo = (engine, mute) => engine?.muteLocalVideoStream(mute);
export const switchAgoraCamera = engine => engine?.switchCamera();
export const setAgoraSpeakerphone = (engine, enabled) => engine?.setEnableSpeakerphone(enabled);
