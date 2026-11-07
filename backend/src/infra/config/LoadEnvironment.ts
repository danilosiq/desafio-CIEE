import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

export function loadEnvironment(
  filePath: string = resolve(__dirname, "../../../.env"),
): void {
  if (existsSync(filePath)) loadEnvFile(filePath);
}
