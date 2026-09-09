/* global jest */

const mockInit = jest.fn(() => Promise.resolve());
const mockUninit = jest.fn();
const mockOnTokenProvide = jest.fn();

jest.mock('@zegocloud/zego-uikit-rn', () => ({
  __esModule: true,
  default: { onTokenProvide: mockOnTokenProvide },
}));

jest.mock('@zegocloud/zego-uikit-prebuilt-call-rn', () => ({
  __esModule: true,
  default: { init: mockInit, uninit: mockUninit },
}));

jest.mock('zego-zim-react-native', () => ({
  __esModule: true,
  default: { create: jest.fn(), getInstance: jest.fn() },
  ZIMConnectionState: { connected: 0 },
}));

jest.unmock('../src/services/zegoCallInvitation');

const {
  initializeZegoCallInvitations,
  uninitializeZegoCallInvitations,
} = require('../src/services/zegoCallInvitation');

afterEach(() => {
  uninitializeZegoCallInvitations();
  jest.clearAllMocks();
});

test('registers the ZIM module namespace required by ZegoUIKit', async () => {
  await initializeZegoCallInvitations('session-token', { _id: '507f1f77bcf86cd799439011', name: 'Faraz' });

  const plugins = mockInit.mock.calls[0][4];
  expect(plugins[0].ZIMConnectionState).toEqual({ connected: 0 });
  expect(plugins[0].default).toBeDefined();
});
