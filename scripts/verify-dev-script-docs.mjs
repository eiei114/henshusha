#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

const devDoctorScript = packageJson.scripts?.["dev:doctor"] ?? "";
assert(
  devDoctorScript.includes("typecheck.mjs"),
  "dev:doctor must run scripts/typecheck.mjs"
);
assert(
  !/\binstall\b/i.test(devDoctorScript),
  "dev:doctor must not install dependencies; contributors run pnpm install separately"
);

const docPaths = ["README.md", "docs/development.md"];
const devDoctorPattern = /`pnpm dev:doctor`\s*—\s*([^\n]+)/g;

for (const docPath of docPaths) {
  const content = readFileSync(path.join(repoRoot, docPath), "utf8");
  const matches = [...content.matchAll(devDoctorPattern)];
  assert(matches.length === 1, `${docPath} must document pnpm dev:doctor exactly once`);

  const description = matches[0][1].toLowerCase();
  assert(
    !description.includes("install"),
    `${docPath} must not claim dev:doctor installs dependencies`
  );
  assert(
    description.includes("typecheck"),
    `${docPath} must describe dev:doctor as a typecheck command`
  );
}

console.log("Dev script docs verification passed.");
