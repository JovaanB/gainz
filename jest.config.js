module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
    transformIgnorePatterns: [
      'node_modules/(?!(react-native|@react-native|expo|@expo|@expo/vector-icons|react-native-vector-icons)/)',
    ],
    collectCoverageFrom: [
      '**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!data/**',
      '!**/__tests__/**',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
    },
  };