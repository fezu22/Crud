import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import * as ZIM from 'zego-zim-react-native';
import { ZEGO_APP_ID, getZegoUserId, getZegoUserName, requestZegoToken } from './zegoService';

let initializedUserId = null;
let initializationPromise = null;
let initializingUserId = null;
let lifecycleGeneration = 0;
const callEventListeners = new Set();

function notifyCallEvent(type) {
  callEventListeners.forEach(listener => listener(type));
}

export function subscribeToZegoCallEvents(listener) {
  callEventListeners.add(listener);
  return () => callEventListeners.delete(listener);
}

export async function initializeZegoCallInvitations(authToken, user) {
  const userId = getZegoUserId(user);
  if (!authToken || !userId) {
    throw new Error('A signed-in user is required before calling can initialize.');
  }
  if (initializedUserId === userId) return;
  if (initializationPromise && initializingUserId === userId) return initializationPromise;
  if (initializationPromise) uninitializeZegoCallInvitations();
  if (initializedUserId) uninitializeZegoCallInvitations();

  const generation = ++lifecycleGeneration;
  initializingUserId = userId;
  initializationPromise = (async () => {
    // Fetch and validate the initial token before starting the invitation
    // service. Prebuilt Call resolves init only after its ZIM login succeeds.
    const initialToken = await requestZegoToken(authToken);
    if (generation !== lifecycleGeneration) return;
    if (!initialToken?.token || (initialToken.userId && initialToken.userId !== userId)) {
      throw new Error('The call service returned credentials for a different user.');
    }

    ZegoUIKit.onTokenProvide(async () => {
      try {
        const refreshedToken = await requestZegoToken(authToken);
        if (!refreshedToken?.token || (refreshedToken.userId && refreshedToken.userId !== userId)) {
          throw new Error('The refreshed call credentials do not match the signed-in user.');
        }
        return refreshedToken.token;
      } catch (error) {
        console.warn('Could not refresh ZEGOCLOUD token:', error);
        return '';
      }
    });

    await ZegoUIKitPrebuiltCallService.init(
      ZEGO_APP_ID,
      '',
      userId,
      getZegoUserName(user),
      [ZIM],
      {
        onOutgoingCallAccepted: () => notifyCallEvent('accepted'),
        onOutgoingCallDeclined: () => notifyCallEvent('declined'),
        onOutgoingCallRejectedCauseBusy: () => notifyCallEvent('busy'),
        onOutgoingCallTimeout: () => notifyCallEvent('timeout'),
        onOutgoingCallCancelButtonPressed: () => notifyCallEvent('canceled'),
      },
    );
    if (generation !== lifecycleGeneration) {
      ZegoUIKitPrebuiltCallService.uninit();
      return;
    }
    initializedUserId = userId;
  })();

  try {
    await initializationPromise;
  } catch (error) {
    ZegoUIKit.onTokenProvide(undefined);
    throw error;
  } finally {
    if (generation === lifecycleGeneration) {
      initializationPromise = null;
      initializingUserId = null;
    }
  }
}

export function uninitializeZegoCallInvitations() {
  lifecycleGeneration += 1;
  if (initializedUserId) ZegoUIKitPrebuiltCallService.uninit();
  ZegoUIKit.onTokenProvide(undefined);
  initializedUserId = null;
  initializationPromise = null;
  initializingUserId = null;
}
