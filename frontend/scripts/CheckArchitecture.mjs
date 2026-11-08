import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const failures = [];
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, e.name);
    if (e.isDirectory()) result.push(...(await walk(name)));
    else result.push(name);
  }
  return result;
}
for (const name of await walk("src")) {
  if (!/\.tsx?$/.test(name)) continue;
  const code = await readFile(name, "utf8");
  if (
    /src\/core\/(pages|components|hooks)\//.test(name) &&
    /from ["']axios["']/.test(code) &&
    !/import \{ isAxiosError/.test(code)
  )
    failures.push(`${name}: Axios deve ficar em services.`);
  if (/\.(test\.ts|spec\.tsx)$/.test(name))
    failures.push(`${name}: utilizar .spec.ts.`);
  if (!name.startsWith("src/app/") && !/^[A-Z]/.test(path.basename(name)))
    failures.push(`${name}: usar PascalCase.`);
  if (/console\.log\(/.test(code))
    failures.push(`${name}: console.log não permitido.`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.info(
    "Arquitetura conferida; política de npm validada na suíte Jest.",
  );
