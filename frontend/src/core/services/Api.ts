import axios from "axios";
import { mockApiAdapter } from "@/mocks/MockApi";
export const api = axios.create({
  baseURL: "/mock-api",
  adapter: mockApiAdapter,
});
