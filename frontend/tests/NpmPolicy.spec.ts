/** @jest-environment node */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
it("mantém instalação reproduzível com npm e Node 24", () => {
  const root = process.cwd();
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  expect(pkg.packageManager).toMatch(/^npm@\d+\.\d+\.\d+$/);
  expect(existsSync(path.join(root, "package-lock.json"))).toBe(true);
  expect(readFileSync(path.join(root, ".nvmrc"), "utf8").trim()).toBe("24.22.2");
  for (const file of ["yarn.lock", ".yarnrc.yml", "npm-shrinkwrap.json", "pnpm-lock.yaml", "bun.lock", "bun.lockb"])
    expect(existsSync(path.join(root, file))).toBe(false);
});
