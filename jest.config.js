module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|@react-native-async-storage|@react-native-documents|react-native-image-picker|react-native-alert-notification|react-native-css-interop|react-native-nitro-modules|react-native-nitro-sound|nativewind)/)',
  ],
  setupFiles: ['./test/setup.js'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
    '^react-native-nitro-sound$': '<rootDir>/test/mocks/nitroSound.js',
    '^react-native-webrtc$': '<rootDir>/test/mocks/reactNativeWebrtc.js',
  },
};
