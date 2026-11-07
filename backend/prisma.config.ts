import { defineConfig } from "prisma/config";
import { loadEnvironment } from "./src/infra/config/LoadEnvironment";

loadEnvironment();

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/Seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
