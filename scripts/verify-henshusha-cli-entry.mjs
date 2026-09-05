#!/usr/bin/env node
import { copyFileSync, existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
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

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "packages", "henshusha", "dist", "index.js");
const tmpRoot = mkdtempSync(path.join(tmpdir(), "henshusha-cli-entry-"));
const symlinkPath = path.join(tmpRoot, "henshusha");
const generatedWorkspace = path.join(tmpRoot, "demo");

try {
  const entryMode = prepareExecutableEntry(distEntry, symlinkPath);
  const result = spawnSync(process.execPath, [symlinkPath, "demo", "--no-install", "--no-git"], {
    cwd: tmpRoot,
    encoding: "utf8",
    timeout: 60_000
  });

  assert(!result.error, result.error?.code === "ETIMEDOUT"
    ? "symlinked CLI timed out after 60s"
    : `symlinked CLI failed to start\n${result.error?.message ?? "unknown error"}`);
  assert(result.status === 0, `symlinked CLI exited with ${result.status ?? "null"}\n${result.stderr}`);
  assert(result.stdout.includes("Created Henshusha workspace at"), `expected scaffold output, got:\n${result.stdout}`);
  assert(existsSync(path.join(generatedWorkspace, ".claude", "skills", "henshusha-render", "SKILL.md")), "missing copied Claude skill");
  assert(existsSync(path.join(generatedWorkspace, ".codex", "skills", "henshusha-edit-timeline", "SKILL.md")), "missing copied Codex skill");
  assert(existsSync(path.join(generatedWorkspace, ".pi", "skills", "henshusha-analyze-source", "SKILL.md")), "missing copied Pi skill");
  assert(existsSync(path.join(generatedWorkspace, "projects", "sample-video", "timelines", "main.timeline.json")), "missing sample timeline");

  const doctorUpdatesResult = spawnSync(process.execPath, [symlinkPath, "doctor", "--updates"], {
    cwd: generatedWorkspace,
    encoding: "utf8",
    timeout: 60_000
  });
  assert(!doctorUpdatesResult.error, doctorUpdatesResult.error?.code === "ETIMEDOUT"
    ? "henshusha doctor --updates timed out after 60s"
    : `henshusha doctor --updates failed to start\n${doctorUpdatesResult.error?.message ?? "unknown error"}`);
  assert(
    doctorUpdatesResult.status === 0,
    `henshusha doctor --updates exited with ${doctorUpdatesResult.status ?? "null"}\n${doctorUpdatesResult.stderr}`
  );
  assert(
    doctorUpdatesResult.stdout.includes("Henshusha doctor"),
    `expected doctor banner, got:\n${doctorUpdatesResult.stdout}`
  );
  assert(
    /henshusha is up to date|Update available:|Could not check npm for henshusha updates\./.test(
      `${doctorUpdatesResult.stdout}\n${doctorUpdatesResult.stderr}`
    ),
    `expected doctor --updates status output, got:\n${doctorUpdatesResult.stdout}\n${doctorUpdatesResult.stderr}`
  );

  console.log(`Verified henshusha CLI entrypoint via ${entryMode}.`);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
