import axios from "axios";

const isTest = process.env.NODE_ENV === "test";

export const api = axios.create({
  baseURL: isTest
    ? "/mock-api"
    : (process.env.NEXT_PUBLIC_API_URL ?? "/api"),
  ...(isTest ? { adapter: require("@/mocks/MockApi").mockApiAdapter } : {}),
});
