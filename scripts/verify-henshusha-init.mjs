#!/usr/bin/env node
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
    existsSync(path.join(existingRepo, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files at repo root"
  );
  assert(!existsSync(path.join(existingRepo, ".git", ".git")), "nested .git must not be created at repo root");
  assert(!existsSync(path.join(existingRepo, "videos", ".git")), "nested .git must not be created under default init target");

  const dirResult = runCli(symlinkPath, ["init", "--dir", "videos", "--no-install"], existingRepo);
  assertCliSuccess(dirResult, "henshusha init --dir videos");
  assert(
    existsSync(path.join(nestedTarget, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files under videos/"
  );
  assert(!existsSync(path.join(nestedTarget, ".git")), "nested .git must not be created under --dir target");

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
