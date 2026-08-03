module.exports = {
  clearMocks: true,
  moduleNameMapper: {
    '^posthog-react-native$': '<rootDir>/test/mocks/posthog-react-native.js',
    '^react-native-config$': '<rootDir>/test/mocks/react-native-config.js',
  },
  preset: '@react-native/jest-preset',
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
