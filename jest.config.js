module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|@react-native-async-storage|react-native-image-picker|react-native-alert-notification|react-native-css-interop|nativewind)/)',
  ],
  setupFiles: ['./test/setup.js'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
  },
};
