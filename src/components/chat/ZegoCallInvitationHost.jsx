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

export function returnToMediApp() {
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) return;
  navigationRef.dispatch(StackActions.popToTop());
}

export default function ZegoCallInvitationHost({ children }) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MediApp">{() => children}</Stack.Screen>
        <Stack.Screen name="ZegoUIKitPrebuiltCallWaitingScreen" component={ZegoUIKitPrebuiltCallWaitingScreen} />
        <Stack.Screen name="ZegoUIKitPrebuiltCallInCallScreen" component={ZegoUIKitPrebuiltCallInCallScreen} />
      </Stack.Navigator>
      <ZegoCallInvitationDialog />
    </NavigationContainer>
  );
}
