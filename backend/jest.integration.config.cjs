module.exports = {
  ...require("./jest.config.cjs"),
  testMatch: ["<rootDir>/tests/integration/**/*.spec.ts"],
  testTimeout: 30000,
};
