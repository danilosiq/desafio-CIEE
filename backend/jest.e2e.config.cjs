module.exports = {
  ...require("./jest.config.cjs"),
  testMatch: ["<rootDir>/tests/e2e/**/*.spec.ts"],
  testTimeout: 60000,
};
