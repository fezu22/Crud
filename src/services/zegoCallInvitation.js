import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import * as ZIM from 'zego-zim-react-native';
import { ZEGO_APP_ID, getZegoUserId, getZegoUserName, requestZegoToken } from './zegoService';

let initializedUserId = null;
let initializationPromise = null;
let initializingUserId = null;
let lifecycleGeneration = 0;
let signalingInitialized = false;
let prebuiltServiceInitialized = false;
const callEventListeners = new Set();

function getSanitizedZegoError(error) {
  return {
    code: error?.code ?? 'unknown',
    message: String(error?.message || 'ZEGOCLOUD initialization failed.').slice(0, 240),
  };
}

function createInitializationError(stage, error) {
  const details = getSanitizedZegoError(error);
  const initializationError = new Error(details.message);
  initializationError.stage = stage;
  initializationError.code = details.code;
  return initializationError;
}

function logInitializationFailure(stage, error) {
  console.warn('[ZEGOCLOUD] initialization failed', {
    stage,
    ...getSanitizedZegoError(error),
  });
}

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
    let initialToken;
    try {
      initialToken = await requestZegoToken(authToken);
    } catch (error) {
      logInitializationFailure('requesting token', error);
      throw createInitializationError('requesting token', error);
    }
    if (generation !== lifecycleGeneration) return;
    if (!initialToken?.token || (initialToken.userId && initialToken.userId !== userId)) {
      const error = new Error('The call service returned credentials for a different user.');
      logInitializationFailure('validating token', error);
      throw createInitializationError('validating token', error);
    }

    const provideFreshToken = async () => {
      try {
        const refreshedToken = await requestZegoToken(authToken);
        if (!refreshedToken?.token || (refreshedToken.userId && refreshedToken.userId !== userId)) {
          throw new Error('The refreshed call credentials do not match the signed-in user.');
        }
        return refreshedToken.token;
      } catch (error) {
        logInitializationFailure('refreshing token', error);
        return '';
      }
    };
    ZegoUIKit.onTokenProvide(provideFreshToken);

    try {
      // This Prebuilt Call version calls ZIM.login(userID, userName) without a
      // token. Log ZIM in with the server-issued token first; the following
      // Prebuilt init observes that completed login and installs its call hooks.
      ZegoUIKit.installPlugins([ZIM]);
      const signalingPlugin = ZegoUIKit.getSignalingPlugin();
      signalingPlugin.init(ZEGO_APP_ID, '');
      signalingInitialized = true;
      signalingPlugin.onRequireNewToken('MediZegoToken', provideFreshToken);
      await signalingPlugin.login(userId, getZegoUserName(user), initialToken.token);
      if (generation !== lifecycleGeneration) return;

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
    } catch (error) {
      logInitializationFailure('Zego init', error);
      throw createInitializationError('Zego init', error);
    }
    prebuiltServiceInitialized = true;
    if (generation !== lifecycleGeneration) {
      ZegoUIKitPrebuiltCallService.uninit();
      signalingInitialized = false;
      prebuiltServiceInitialized = false;
      return;
    }
    initializedUserId = userId;
  })();

  try {
    await initializationPromise;
  } catch (error) {
    uninitializeZegoCallInvitations();
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
  if (prebuiltServiceInitialized) {
    ZegoUIKitPrebuiltCallService.uninit();
  } else if (signalingInitialized) {
    // Prebuilt init did not complete, so it cannot tear down the direct,
    // token-authenticated ZIM login started above.
    const signalingPlugin = ZegoUIKit.getSignalingPlugin();
    signalingPlugin.onRequireNewToken('MediZegoToken');
    signalingPlugin.logout()?.catch?.(() => {});
    signalingPlugin.uninit();
  }
  ZegoUIKit.onTokenProvide(undefined);
  initializedUserId = null;
  signalingInitialized = false;
  prebuiltServiceInitialized = false;
  initializationPromise = null;
  initializingUserId = null;
}
