import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallInvitationService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZIM from 'zego-zim-react-native';
import { ZEGO_APP_ID, getZegoUserId, getZegoUserName, requestZegoToken } from './zegoService';

let initializedUserId = null;

export async function initializeZegoCallInvitations(authToken, user) {
  const userId = getZegoUserId(user);
  if (!authToken || !userId) return;
  if (initializedUserId === userId) return;
  if (initializedUserId) uninitializeZegoCallInvitations();

  ZegoUIKit.onTokenProvide(async () => {
    const result = await requestZegoToken(authToken);
    return result.token;
  });

  await ZegoUIKitPrebuiltCallInvitationService.init(
    ZEGO_APP_ID,
    '',
    userId,
    getZegoUserName(user),
    [ZIM],
  );
  initializedUserId = userId;
}

export function uninitializeZegoCallInvitations() {
  if (!initializedUserId) return;
  ZegoUIKitPrebuiltCallInvitationService.uninit();
  ZegoUIKit.onTokenProvide(undefined);
  initializedUserId = null;
}
