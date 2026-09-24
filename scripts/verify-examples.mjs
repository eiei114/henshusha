#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const publishedVersion = JSON.parse(
  readFileSync(path.join(repoRoot, "packages/henshusha/package.json"), "utf8")
).version;
assert(publishedVersion, "packages/henshusha/package.json must define version");

const examplePackageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "examples/basic-workspace/package.json"), "utf8")
);
assert(
  examplePackageJson.devDependencies?.henshusha === publishedVersion,
  `examples/basic-workspace must pin henshusha@${publishedVersion}, got ${examplePackageJson.devDependencies?.henshusha ?? "missing"}`
);

const basicReadme = readFileSync(path.join(repoRoot, "examples/basic/README.md"), "utf8");
for (const needle of [
  "basic-workspace",
  "npm run validate",
  "npm run doctor:updates",
  "pnpm dev:fixture",
  "Copy-Item -Recurse"
]) {
  assert(basicReadme.includes(needle), `examples/basic/README.md must mention ${needle}`);
}

const workspaceReadme = readFileSync(
  path.join(repoRoot, "examples/basic-workspace/README.md"),
  "utf8"
);
for (const needle of ["henshusha@latest", "bunx henshusha@latest"]) {
  assert(
    workspaceReadme.includes(needle),
    `examples/basic-workspace/README.md must mention ${needle}`
  );
}

const distEntry = path.join(repoRoot, "packages/henshusha/dist/index.js");
for (const projectName of ["sample-video", "short-clip"]) {
  const projectDir = path.join(repoRoot, "examples/basic-workspace/projects", projectName);
  const validate = spawnSync(process.execPath, [distEntry, "validate", projectDir], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 60_000
  });
  assert(!validate.error, validate.error?.message ?? `${projectName} validate failed to start`);
  assert(
    validate.status === 0,
    `${projectName} example validate failed\n${validate.stderr}${validate.stdout}`
  );
}

console.log("Examples verification passed.");
