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

const examplePackageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "examples/basic-workspace/package.json"), "utf8")
);
const exampleVersion = examplePackageJson.devDependencies?.henshusha;
assert(
  typeof exampleVersion === "string" && /^[0-9A-Za-z.+-]+$/.test(exampleVersion),
  `examples/basic-workspace must pin an exact henshusha npm version, got ${exampleVersion ?? "missing"}`
);

const npmViewArgs = ["view", `henshusha@${exampleVersion}`, "version"];
const npmView = spawnSync(
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm",
  process.platform === "win32"
    ? ["/d", "/s", "/c", `npm.cmd ${npmViewArgs.join(" ")}`]
    : npmViewArgs,
  { cwd: repoRoot, encoding: "utf8", timeout: 30_000 }
);
const npmViewOutput = [
  npmView.error?.message,
  npmView.stderr?.trim(),
  npmView.stdout?.trim()
]
  .filter(Boolean)
  .join(" ");
assert(
  npmView.status === 0 && npmView.stdout.trim() === exampleVersion,
  `examples/basic-workspace must pin a published henshusha version; npm view henshusha@${exampleVersion} version failed${npmViewOutput ? `: ${npmViewOutput}` : ""}`
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

const packagedTemplateReadme = readFileSync(
  path.join(repoRoot, "packages/henshusha/templates/basic/README.md"),
  "utf8"
);
assert(
  packagedTemplateReadme.includes("npx henshusha@latest my-studio"),
  "packages/henshusha/templates/basic/README.md must use npx henshusha@latest my-studio"
);

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
