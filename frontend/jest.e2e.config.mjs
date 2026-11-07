import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./" });
export default createJestConfig({
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/e2e/**/*.spec.ts"],
  testTimeout: 40000,
  maxWorkers: 1,
  collectCoverage: false,
});
