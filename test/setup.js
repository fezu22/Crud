/* global jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest';
import { AccessibilityInfo } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async () => 'task-reminders'),
    displayNotification: jest.fn(async () => 'test-notification'),
    createTriggerNotification: jest.fn(async () => 'test-trigger'),
    cancelNotification: jest.fn(async () => {}),
    cancelAllNotifications: jest.fn(async () => {}),
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

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(() => {}));
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
