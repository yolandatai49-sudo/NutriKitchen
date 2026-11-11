module.exports = {
  preset: 'jest-expo/ios',
  testMatch: ['<rootDir>/tests/ui/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/ui/setup.ts'],
};
