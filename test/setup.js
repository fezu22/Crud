/* global jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest';
import { AccessibilityInfo } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@craftzdog/react-native-buffer', () => ({
  Buffer: require('buffer').Buffer,
}));
jest.mock('react-native-quick-crypto', () => ({
  __esModule: true,
  createCipheriv: jest.fn(),
  createDecipheriv: jest.fn(),
  pbkdf2Sync: jest.fn(() => require('buffer').Buffer.alloc(32)),
  randomBytes: jest.fn(size => require('buffer').Buffer.alloc(size)),
}));
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { Animated } = require('react-native');
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: initial => ({ value: initial }),
    useAnimatedStyle: updater => updater(),
    withSpring: value => value,
    withTiming: value => value,
    Easing: {
      out: value => value,
      in: value => value,
      ease: value => value,
    },
    createAnimatedComponent: component => component,
    call: jest.fn(),
    runOnJS: callback => callback,
    __mockReact: React,
  };
});
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async () => 'task-reminders'),
    displayNotification: jest.fn(async () => 'test-notification'),
    createTriggerNotification: jest.fn(async () => 'test-trigger'),
    cancelNotification: jest.fn(async () => { }),
    cancelAllNotifications: jest.fn(async () => { }),
    getTriggerNotificationIds: jest.fn(async () => []),
    getNotificationSettings: jest.fn(async () => ({
      authorizationStatus: 1,
      android: { alarm: 1 },
    })),
  },
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationSetting: { DISABLED: 0, ENABLED: 1 },
  AndroidStyle: { BIGTEXT: 1 },
  TriggerType: { TIMESTAMP: 0 },
  AuthorizationStatus: {
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));
jest.mock('@react-native-documents/picker', () => ({
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: error => Boolean(error?.code),
  pick: jest.fn(async () => []),
  types: { audio: 'audio/*', video: 'video/*' },
}));

jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
    setColorScheme: jest.fn(),
    toggleColorScheme: jest.fn(),
  }),
  vars: value => value,
}));

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(() => { }));
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
