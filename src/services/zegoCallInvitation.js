import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService, { ZegoCallEndReason } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import * as ZIM from 'zego-zim-react-native';
import { ZEGO_APP_ID, getZegoUserId, getZegoUserName, requestZegoToken } from './zegoService';
import { getZegoCallUiConfig } from '../components/chat/ZegoCallUi';

let initializedUserId = null;
let initializationPromise = null;
let initializingUserId = null;
let lifecycleGeneration = 0;
let signalingInitialized = false;
let prebuiltServiceInitialized = false;
let zimConnectionState = null;
let zimConnectionEvent = null;
const callEventListeners = new Set();
const ZIM_CONNECTION_LOG_ID = 'medi_runtime_zim_connection';

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

function logInitializationStage(stage, details = {}) {
  console.info('[ZEGOCLOUD][release-check]', {
    stage,
    ...details,
  });
}

function logHangup(stage, details = {}) {
  console.info('[ZEGOCLOUD][hangup]', {
    stage,
    callID: details.callID,
    reason: details.reason,
    duration: details.duration,
  });
}

function getCallEndEvent(reason) {
  if (reason === ZegoCallEndReason.remoteHangUp) return 'remoteHangUp';
  if (reason === ZegoCallEndReason.kickOut) return 'kickOut';
  return 'localHangUp';
}

function notifyCallEvent(type, details) {
  callEventListeners.forEach(listener => listener(type, details));
}

function logRuntimeZim(stage, details = {}) {
  console.info('[RUNTIME] ZIM connection state', {
    stage,
    ...details,
  });
}

function getActiveCallState() {
  let inRoom = false;
  try {
    inRoom = Boolean(ZegoUIKit.inRoom?.());
  } catch {
    inRoom = false;
  }
  return {
    inRoom,
    initializedUserId,
    initializingUserId,
    zimConnectionState,
    zimConnectionEvent,
  };
}

export function subscribeToZegoCallEvents(listener) {
  callEventListeners.add(listener);
  return () => callEventListeners.delete(listener);
}

export function getZegoRuntimeState() {
  return getActiveCallState();
}

export async function initializeZegoCallInvitations(authToken, user) {
  const userId = getZegoUserId(user);
  if (!authToken || !userId) {
    throw new Error('A signed-in user is required before calling can initialize.');
  }
  if (initializedUserId === userId) {
    logInitializationStage('init already ready', { userId });
    return;
  }
  if (initializationPromise && initializingUserId === userId) {
    logInitializationStage('init already in progress', { userId });
    return initializationPromise;
  }
  if (initializationPromise) uninitializeZegoCallInvitations();
  if (initializedUserId) uninitializeZegoCallInvitations();

  const generation = ++lifecycleGeneration;
  initializingUserId = userId;
  initializationPromise = (async () => {
    let initialToken;
    logInitializationStage('init started', {
      appId: ZEGO_APP_ID,
      userId,
      hasAuthToken: Boolean(authToken),
    });
    try {
      initialToken = await requestZegoToken(authToken, userId);
    } catch (error) {
      logInitializationFailure('requesting token', error);
      throw createInitializationError('requesting token', error);
    }
    if (generation !== lifecycleGeneration) return;
    if (initialToken?.appId && Number(initialToken.appId) !== ZEGO_APP_ID) {
      const error = new Error('The call service returned credentials for a different ZEGOCLOUD app.');
      logInitializationFailure('validating app id', error);
      throw createInitializationError('validating app id', error);
    }

    if (!initialToken?.token || (initialToken.userId && initialToken.userId !== userId)) {
      const error = new Error('The call service returned credentials for a different user.');
      logInitializationFailure('validating token', error);
      throw createInitializationError('validating token', error);
    }

    const provideFreshToken = async () => {
      try {
        const refreshedToken = await requestZegoToken(authToken, userId);
        if (refreshedToken?.appId && Number(refreshedToken.appId) !== ZEGO_APP_ID) {
          throw new Error('The refreshed call credentials do not match the configured ZEGOCLOUD app.');
        }
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
      const handleSdkCallEnd = (callID, reason, duration) => {
        const details = {
          callID,
          reason,
          duration,
          endEvent: getCallEndEvent(reason),
        };

        if (reason === ZegoCallEndReason.localHangUp) {
          logHangup('local hangup requested', details);
        }

        if (reason === ZegoCallEndReason.remoteHangUp) {
          logHangup('remote hangup received', details);
        }

        logHangup('onCallEnd', details);
        notifyCallEvent('ended', details);
      };

      // This Prebuilt Call version calls ZIM.login(userID, userName) without a
      // token. Log ZIM in with the server-issued token first; the following
      // Prebuilt init observes that completed login and installs its call hooks.
      ZegoUIKit.installPlugins([ZIM]);
      const signalingPlugin = ZegoUIKit.getSignalingPlugin();
      if (
        !signalingPlugin ||
        typeof signalingPlugin.init !== 'function' ||
        typeof signalingPlugin.login !== 'function'
      ) {
        throw new Error('The installed ZEGOCLOUD signaling plugin is unavailable.');
      }
      signalingPlugin.init(ZEGO_APP_ID, '');
      signalingInitialized = true;
      if (typeof signalingPlugin.onConnectionStateChanged === 'function') {
        signalingPlugin.onConnectionStateChanged(ZIM_CONNECTION_LOG_ID, data => {
          zimConnectionState = data?.state;
          zimConnectionEvent = data?.event;
          logRuntimeZim('changed', {
            state: zimConnectionState,
            event: zimConnectionEvent,
            userId,
          });
        });
      }
      logInitializationStage('ZIM login start', { userId });
      await signalingPlugin.login(userId, getZegoUserName(user), initialToken.token);
      if (generation !== lifecycleGeneration) return;
      logInitializationStage('ZIM login success', { userId });

      logInitializationStage('prebuilt init start', { userId });
      await ZegoUIKitPrebuiltCallService.init(
        ZEGO_APP_ID,
        '',
        userId,
        getZegoUserName(user),
        [ZIM],
        {
          ...getZegoCallUiConfig(handleSdkCallEnd),
          onOutgoingCallAccepted: (...details) => notifyCallEvent('accepted', details),
          onOutgoingCallDeclined: (...details) => notifyCallEvent('declined', details),
          onOutgoingCallRejectedCauseBusy: (...details) => notifyCallEvent('busy', details),
          onOutgoingCallTimeout: (...details) => notifyCallEvent('timeout', details),
          onOutgoingCallCancelButtonPressed: (...details) => notifyCallEvent('canceled', details),
        },
      );
      logInitializationStage('prebuilt init success', { userId });
    } catch (error) {
      logInitializationFailure('Zego init', error);
      logInitializationStage('ZIM/prebuilt login failure', {
        userId,
        ...getSanitizedZegoError(error),
      });
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
    logInitializationStage('init final status', {
      userId,
      status: 'ready',
    });
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

export async function ensureZegoCallInvitations(authToken, user) {
  const userId = getZegoUserId(user);
  const state = getActiveCallState();
  console.info('[RUNTIME] foreground restore', {
    stage: 'zego ensure requested',
    userId,
    activeCallState: state,
  });

  if (state.inRoom) {
    return;
  }

  if (
    initializedUserId === userId &&
    (zimConnectionState === null || zimConnectionState === 2 || zimConnectionState === 3)
  ) {
    return;
  }

  if (initializedUserId === userId) {
    uninitializeZegoCallInvitations();
  }

  await initializeZegoCallInvitations(authToken, user);
}

export function uninitializeZegoCallInvitations() {
  lifecycleGeneration += 1;
  const signalingPlugin = ZegoUIKit.getSignalingPlugin();
  if (typeof signalingPlugin?.onConnectionStateChanged === 'function') {
    signalingPlugin.onConnectionStateChanged(ZIM_CONNECTION_LOG_ID);
  }
  if (prebuiltServiceInitialized) {
    ZegoUIKitPrebuiltCallService.uninit();
  } else if (signalingInitialized) {
    // Prebuilt init did not complete, so it cannot tear down the direct,
    // token-authenticated ZIM login started above.
    if (typeof signalingPlugin?.logout === 'function') {
      signalingPlugin.logout()?.catch?.(() => {});
    }
    if (typeof signalingPlugin?.uninit === 'function') {
      signalingPlugin.uninit();
    }
  }
  ZegoUIKit.onTokenProvide(undefined);
  initializedUserId = null;
  signalingInitialized = false;
  prebuiltServiceInitialized = false;
  zimConnectionState = null;
  zimConnectionEvent = null;
  initializationPromise = null;
  initializingUserId = null;
}
