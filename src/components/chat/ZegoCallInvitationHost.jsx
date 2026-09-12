import React from 'react';
import {
  createNavigationContainerRef,
  NavigationContainer,
  StackActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ZegoCallInvitationDialog,
  ZegoUIKitPrebuiltCallInCallScreen,
  ZegoUIKitPrebuiltCallWaitingScreen,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const ZEGO_CALL_ROUTES = new Set([
  'ZegoUIKitPrebuiltCallWaitingScreen',
  'ZegoUIKitPrebuiltCallInCallScreen',
]);

let activeRouteName = 'MediApp';
let returnNavigationInFlight = false;

function getActiveRouteName(state) {
  const route = state?.routes?.[state.index ?? 0];

  if (!route) {
    return activeRouteName;
  }

  return route.state ? getActiveRouteName(route.state) : route.name;
}

function setActiveRouteName(state) {
  activeRouteName = getActiveRouteName(state);

  if (!ZEGO_CALL_ROUTES.has(activeRouteName)) {
    returnNavigationInFlight = false;
  }
}

function syncNavigationState() {
  const state = navigationRef.getRootState?.();
  if (state) {
    setActiveRouteName(state);
    return;
  }

  activeRouteName = navigationRef.getCurrentRoute?.()?.name || activeRouteName;
}

export function returnToMediApp() {
  if (!navigationRef.isReady()) return false;

  const currentRouteName =
    navigationRef.getCurrentRoute?.()?.name ||
    activeRouteName;

  if (!ZEGO_CALL_ROUTES.has(currentRouteName)) {
    returnNavigationInFlight = false;
    return false;
  }

  if (returnNavigationInFlight || !navigationRef.canGoBack()) {
    return false;
  }

  returnNavigationInFlight = true;
  navigationRef.dispatch(StackActions.popToTop());
  return true;
}

export default function ZegoCallInvitationHost({ children }) {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={syncNavigationState}
      onStateChange={setActiveRouteName}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MediApp">{() => children}</Stack.Screen>
        <Stack.Screen name="ZegoUIKitPrebuiltCallWaitingScreen" component={ZegoUIKitPrebuiltCallWaitingScreen} />
        <Stack.Screen name="ZegoUIKitPrebuiltCallInCallScreen" component={ZegoUIKitPrebuiltCallInCallScreen} />
      </Stack.Navigator>
      <ZegoCallInvitationDialog />
    </NavigationContainer>
  );
}
