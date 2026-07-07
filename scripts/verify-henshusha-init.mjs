#!/usr/bin/env node
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function prepareExecutableEntry(sourcePath, targetPath) {
  try {
    symlinkSync(sourcePath, targetPath, "file");
    return "symlink";
  } catch (error) {
    if (!["EPERM", "EACCES", "UNKNOWN"].includes(error?.code ?? "")) throw error;
    copyFileSync(sourcePath, targetPath);
    return "copy";
  }
}

function runCli(cliPath, args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 60_000
  });
}

function assertCliSuccess(result, label) {
  assert(!result.error, result.error?.code === "ETIMEDOUT"
    ? `${label} timed out after 60s`
    : `${label} failed to start\n${result.error?.message ?? "unknown error"}`);
  assert(result.status === 0, `${label} exited with ${result.status ?? "null"}\n${result.stderr}`);
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "packages", "henshusha", "dist", "index.js");
const tmpRoot = mkdtempSync(path.join(tmpdir(), "henshusha-init-"));
const symlinkPath = path.join(tmpRoot, "henshusha");
const existingRepo = path.join(tmpRoot, "existing-repo");
const nestedTarget = path.join(existingRepo, "videos");

try {
  const entryMode = prepareExecutableEntry(distEntry, symlinkPath);

  mkdirSync(existingRepo, { recursive: true });
  writeFileSync(path.join(existingRepo, "README.md"), "# Existing product repo\n", "utf8");
  writeFileSync(path.join(existingRepo, ".gitignore"), "node_modules/\nbuild/\n", "utf8");
  const existingPackageJson = {
    name: "my-existing-product",
    version: "1.2.3",
    type: "commonjs",
    private: true,
    scripts: {
      build: "tsc -p tsconfig.json",
      test: "node --test",
      validate: "legacy-validate"
    },
    dependencies: {
      lodash: "^4.17.21"
    }
  };
  writeFileSync(path.join(existingRepo, "package.json"), `${JSON.stringify(existingPackageJson, null, 2)}\n`, "utf8");
  const gitInit = spawnSync("git", ["init", "--initial-branch=main"], {
    cwd: existingRepo,
    encoding: "utf8"
  });
  assert(gitInit.status === 0, `git init failed in fixture repo\n${gitInit.stderr}`);

  const initResult = runCli(symlinkPath, ["init", "--no-install"], existingRepo);
  assertCliSuccess(initResult, "henshusha init");
  assert(initResult.stdout.includes("Detected Git repository root:"), `expected git root detection, got:\n${initResult.stdout}`);
  assert(initResult.stdout.includes("Initialized Henshusha workspace at"), `expected init output, got:\n${initResult.stdout}`);
  assert(initResult.stdout.includes("Skipped git init"), `expected skipped git init message, got:\n${initResult.stdout}`);
  assert(
    initResult.stderr.includes('Warning: kept existing script "validate"'),
    `expected conflict warning for validate script, got:\n${initResult.stderr}`
  );
  assert(
    existsSync(path.join(existingRepo, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files at repo root"
  );
  assert(!existsSync(path.join(existingRepo, ".git", ".git")), "nested .git must not be created at repo root");
  assert(!existsSync(path.join(existingRepo, "videos", ".git")), "nested .git must not be created under default init target");
  const rootPackageJson = JSON.parse(readFileSync(path.join(existingRepo, "package.json"), "utf8"));
  assert(rootPackageJson.name === "my-existing-product", `expected existing package name to be preserved, got ${rootPackageJson.name}`);
  assert(rootPackageJson.version === "1.2.3", "expected existing package version to be preserved");
  assert(rootPackageJson.type === "commonjs", "expected existing package type to be preserved");
  assert(rootPackageJson.dependencies.lodash === "^4.17.21", "expected existing dependencies to be preserved");
  assert(rootPackageJson.scripts.build === "tsc -p tsconfig.json", "expected existing build script to be preserved");
  assert(rootPackageJson.scripts.test === "node --test", "expected existing test script to be preserved");
  assert(rootPackageJson.scripts.validate === "legacy-validate", "expected conflicting validate script to remain unchanged by default");
  assert(
    rootPackageJson.scripts.render?.includes("projects/sample-video"),
    "expected henshusha render script to be added"
  );
  assert(
    typeof rootPackageJson.devDependencies?.henshusha === "string",
    "expected henshusha devDependency to be added without clobbering package metadata"
  );

  const rootGitignore = readFileSync(path.join(existingRepo, ".gitignore"), "utf8");
  assert(rootGitignore.startsWith("node_modules/\nbuild/\n"), "expected existing gitignore content to be preserved");
  assert(rootGitignore.includes("# BEGIN henshusha"), "expected managed gitignore block to be appended");
  assert(rootGitignore.includes("projects/*/sources/raw/*"), "expected henshusha gitignore paths at repo root");
  assert(countOccurrences(rootGitignore, "# BEGIN henshusha") === 1, "expected a single henshusha gitignore block");

  const repeatInit = runCli(symlinkPath, ["init", "--no-install"], existingRepo);
  assertCliSuccess(repeatInit, "repeat henshusha init");
  const repeatPackageJson = JSON.parse(readFileSync(path.join(existingRepo, "package.json"), "utf8"));
  assert(
    JSON.stringify(repeatPackageJson.scripts) === JSON.stringify(rootPackageJson.scripts),
    "expected repeat init to leave package scripts unchanged"
  );
  const repeatGitignore = readFileSync(path.join(existingRepo, ".gitignore"), "utf8");
  assert(repeatGitignore === rootGitignore, "expected repeat init to leave gitignore unchanged");

  const forceInit = runCli(symlinkPath, ["init", "--no-install", "--force"], existingRepo);
  assertCliSuccess(forceInit, "henshusha init --force");
  const forcedPackageJson = JSON.parse(readFileSync(path.join(existingRepo, "package.json"), "utf8"));
  assert(
    forcedPackageJson.scripts.validate.includes("henshusha validate projects/sample-video"),
    "expected --force to overwrite conflicting validate script"
  );

  const dirResult = runCli(symlinkPath, ["init", "--dir", "videos", "--no-install"], existingRepo);
  assertCliSuccess(dirResult, "henshusha init --dir videos");
  assert(
    existsSync(path.join(nestedTarget, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files under videos/"
  );
  assert(!existsSync(path.join(nestedTarget, ".git")), "nested .git must not be created under --dir target");
  const nestedPackageJsonPath = path.join(nestedTarget, "package.json");
  assert(existsSync(nestedPackageJsonPath), "expected scaffold package.json under --dir target");
  const nestedPackageJson = JSON.parse(readFileSync(nestedPackageJsonPath, "utf8"));
  assert(
    nestedPackageJson.name === "videos",
    `expected scaffold package name under --dir target, got ${nestedPackageJson.name}`
  );
  assert(
    nestedPackageJson.scripts?.validate?.includes("henshusha validate projects/sample-video"),
    "expected henshusha scripts on fresh --dir scaffold"
  );
  const nestedGitignore = readFileSync(path.join(existingRepo, ".gitignore"), "utf8");
  assert(
    nestedGitignore.includes("videos/projects/*/sources/raw/*"),
    "expected --dir gitignore paths to target nested workspace"
  );
  assert(
    countOccurrences(nestedGitignore, "# BEGIN henshusha") === 1,
    "expected idempotent gitignore block update for --dir"
  );

  const standaloneRoot = path.join(tmpRoot, "standalone");
  mkdirSync(standaloneRoot, { recursive: true });
  const occupiedWorkspace = path.join(standaloneRoot, "blocked-name");
  mkdirSync(occupiedWorkspace, { recursive: true });
  writeFileSync(path.join(occupiedWorkspace, "occupied.txt"), "keep\n", "utf8");
  const standaloneResult = runCli(symlinkPath, ["blocked-name", "--no-install", "--no-git"], standaloneRoot);
  assert(standaloneResult.status !== 0, "standalone scaffold should reject non-empty targets");
  assert(
    /not empty/i.test(standaloneResult.stderr) || /not empty/i.test(standaloneResult.stdout),
    `expected non-empty rejection, got:\n${standaloneResult.stdout}\n${standaloneResult.stderr}`
  );

  console.log(`Verified henshusha embedded init via ${entryMode}.`);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
