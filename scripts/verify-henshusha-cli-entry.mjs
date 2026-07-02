#!/usr/bin/env node
import { existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "packages", "henshusha", "dist", "index.js");
const tmpRoot = mkdtempSync(path.join(tmpdir(), "henshusha-cli-entry-"));
const symlinkPath = path.join(tmpRoot, "henshusha");
const generatedWorkspace = path.join(tmpRoot, "demo");

try {
  symlinkSync(distEntry, symlinkPath);
  const result = spawnSync(process.execPath, [symlinkPath, "demo", "--no-install", "--no-git"], {
    cwd: tmpRoot,
    encoding: "utf8"
  });

  assert(result.status === 0, `symlinked CLI exited with ${result.status ?? "null"}\n${result.stderr}`);
  assert(result.stdout.includes("Created Henshusha workspace at"), `expected scaffold output, got:\n${result.stdout}`);
  assert(existsSync(path.join(generatedWorkspace, ".claude", "skills", "henshusha-render", "SKILL.md")), "missing copied Claude skill");
  assert(existsSync(path.join(generatedWorkspace, ".codex", "skills", "henshusha-edit-timeline", "SKILL.md")), "missing copied Codex skill");
  assert(existsSync(path.join(generatedWorkspace, ".pi", "skills", "henshusha-analyze-source", "SKILL.md")), "missing copied Pi skill");
  assert(existsSync(path.join(generatedWorkspace, "projects", "sample-video", "timelines", "main.timeline.json")), "missing sample timeline");

  console.log("Verified symlinked henshusha CLI entrypoint.");
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
