import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });
export default createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/Setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
  collectCoverageFrom: [
    "src/core/**/*.{ts,tsx}",
    "src/mocks/**/*.ts",
    "!src/core/types/**",
    "!src/core/lib/Utils.ts",
  ],
  coverageReporters: ["text", "lcov"],
});
