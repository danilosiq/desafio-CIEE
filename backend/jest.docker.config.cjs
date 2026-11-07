module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: ['<rootDir>/tests/docker/**/*.spec.ts'],
  testTimeout: 240000,
};
