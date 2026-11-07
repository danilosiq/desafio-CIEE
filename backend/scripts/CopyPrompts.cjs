const { cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const target = join("dist", "modules", "resume-processing", "infra", "prompts");
mkdirSync(target, { recursive: true });
cpSync(join("src", "modules", "resume-processing", "infra", "prompts", "ExtractResumeV1.md"), join(target, "ExtractResumeV1.md"));
