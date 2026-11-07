module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.spec.ts"],
  transform: { "^.+\\.ts$": "<rootDir>/scripts/JestTransform.cjs" },
};
