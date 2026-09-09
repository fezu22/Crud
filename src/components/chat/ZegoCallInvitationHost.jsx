import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ZegoCallInvitationDialog,
  ZegoUIKitPrebuiltCallInCallScreen,
  ZegoUIKitPrebuiltCallWaitingScreen,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

const Stack = createNativeStackNavigator();

export default function ZegoCallInvitationHost({ children }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MediApp">{() => children}</Stack.Screen>
        <Stack.Screen name="ZegoUIKitPrebuiltCallWaitingScreen" component={ZegoUIKitPrebuiltCallWaitingScreen} />
        <Stack.Screen name="ZegoUIKitPrebuiltCallInCallScreen" component={ZegoUIKitPrebuiltCallInCallScreen} />
      </Stack.Navigator>
      <ZegoCallInvitationDialog />
    </NavigationContainer>
  );
}
