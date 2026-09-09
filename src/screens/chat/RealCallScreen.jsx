import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { ZegoUIKitPrebuiltCall } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { getZegoUserId, getZegoUserName, requestZegoToken, ZEGO_APP_ID } from '../../services/zegoService';

export default function RealCallScreen({ contact, token, callType = 'voice', onEnd, currentUser }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    let mounted = true;
    ZegoUIKit.onTokenProvide(async () => (await requestZegoToken(token)).token);
    requestZegoToken(token).then(value => mounted && setSession(value)).catch(error => {
      if (mounted) { Alert.alert('Call unavailable', error.message); onEnd?.(); }
    });
    return () => { mounted = false; ZegoUIKit.onTokenProvide(undefined); };
  }, [token, onEnd]);
  if (!session || !currentUser || !contact?.id) return <View style={{ flex: 1 }} />;
  return <ZegoUIKitPrebuiltCall
    appID={ZEGO_APP_ID}
    appSign=""
    token={session.token}
    userID={getZegoUserId(currentUser)}
    userName={getZegoUserName(currentUser)}
    callID={`medi_${[getZegoUserId(currentUser), String(contact.id)].sort().join('_')}`}
    config={{
      turnOnCameraWhenJoining: callType === 'video',
      turnOnMicrophoneWhenJoining: true,
      onHangUp: onEnd,
      onCallEnd: onEnd,
    }}
  />;
}
