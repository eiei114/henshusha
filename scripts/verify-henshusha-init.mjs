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
  const existingPackageJson = {
    name: "my-existing-product",
    private: true,
    scripts: {
      build: "tsc -p tsconfig.json",
      test: "node --test"
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
    existsSync(path.join(existingRepo, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files at repo root"
  );
  assert(!existsSync(path.join(existingRepo, ".git", ".git")), "nested .git must not be created at repo root");
  assert(!existsSync(path.join(existingRepo, "videos", ".git")), "nested .git must not be created under default init target");
  const rootPackageJson = JSON.parse(readFileSync(path.join(existingRepo, "package.json"), "utf8"));
  assert(rootPackageJson.name === "my-existing-product", `expected existing package name to be preserved, got ${rootPackageJson.name}`);
  assert(rootPackageJson.scripts.build === "tsc -p tsconfig.json", "expected existing build script to be preserved");
  assert(rootPackageJson.scripts.test === "node --test", "expected existing test script to be preserved");
  assert(
    typeof rootPackageJson.devDependencies?.henshusha === "string",
    "expected henshusha devDependency to be added without clobbering package metadata"
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
    nestedPackageJson.scripts?.validate?.includes("henshusha validate"),
    "expected henshusha scripts on fresh --dir scaffold"
  );

  const piOnlyRepo = path.join(tmpRoot, "pi-only-repo");
  mkdirSync(piOnlyRepo, { recursive: true });
  writeFileSync(path.join(piOnlyRepo, "package.json"), '{"name":"pi-only"}\n', "utf8");
  assert(spawnSync("git", ["init", "--initial-branch=main"], { cwd: piOnlyRepo, encoding: "utf8" }).status === 0);
  const piOnlyResult = runCli(symlinkPath, ["init", "--agents", "pi", "--no-install"], piOnlyRepo);
  assertCliSuccess(piOnlyResult, "henshusha init --agents pi");
  assert(
    existsSync(path.join(piOnlyRepo, ".pi", "skills", "henshusha-render", "SKILL.md")),
    "expected Pi henshusha skills for --agents pi"
  );
  assert(
    !existsSync(path.join(piOnlyRepo, ".claude", "skills", "henshusha-render", "SKILL.md")),
    "Claude henshusha skills must be skipped for --agents pi"
  );
  assert(
    !existsSync(path.join(piOnlyRepo, ".codex", "skills", "henshusha-render", "SKILL.md")),
    "Codex henshusha skills must be skipped for --agents pi"
  );

  const noSkillsRepo = path.join(tmpRoot, "no-skills-repo");
  mkdirSync(noSkillsRepo, { recursive: true });
  writeFileSync(path.join(noSkillsRepo, "package.json"), '{"name":"no-skills"}\n', "utf8");
  assert(spawnSync("git", ["init", "--initial-branch=main"], { cwd: noSkillsRepo, encoding: "utf8" }).status === 0);
  const noSkillsResult = runCli(symlinkPath, ["init", "--no-skills", "--no-install"], noSkillsRepo);
  assertCliSuccess(noSkillsResult, "henshusha init --no-skills");
  assert(
    !existsSync(path.join(noSkillsRepo, ".pi", "skills", "henshusha-render", "SKILL.md")),
    "--no-skills must not install agent skill folders"
  );

  const nestedAgentsRepo = path.join(tmpRoot, "nested-agents-repo");
  const nestedContentDir = path.join(nestedAgentsRepo, "content");
  mkdirSync(nestedAgentsRepo, { recursive: true });
  writeFileSync(path.join(nestedAgentsRepo, "package.json"), '{"name":"nested-agents"}\n', "utf8");
  assert(spawnSync("git", ["init", "--initial-branch=main"], { cwd: nestedAgentsRepo, encoding: "utf8" }).status === 0);
  const nestedAgentsResult = runCli(
    symlinkPath,
    ["init", "--dir", "content", "--agents", "pi", "--no-install"],
    nestedAgentsRepo
  );
  assertCliSuccess(nestedAgentsResult, "henshusha init --dir content --agents pi");
  assert(
    existsSync(path.join(nestedContentDir, "projects", "sample-video", "timelines", "main.timeline.json")),
    "expected scaffold files under --dir content"
  );
  assert(
    existsSync(path.join(nestedAgentsRepo, ".pi", "skills", "henshusha-render", "SKILL.md")),
    "expected Pi skills at Git root for --dir init"
  );
  assert(
    !existsSync(path.join(nestedContentDir, ".pi", "skills", "henshusha-render", "SKILL.md")),
    "Pi skills must not be installed under deep --dir target"
  );

  const preserveRepo = path.join(tmpRoot, "preserve-repo");
  const customSkillDir = path.join(preserveRepo, ".claude", "skills", "custom-other");
  mkdirSync(customSkillDir, { recursive: true });
  writeFileSync(path.join(customSkillDir, "SKILL.md"), "# custom\n", "utf8");
  writeFileSync(path.join(preserveRepo, "package.json"), '{"name":"preserve"}\n', "utf8");
  assert(spawnSync("git", ["init", "--initial-branch=main"], { cwd: preserveRepo, encoding: "utf8" }).status === 0);
  const preserveResult = runCli(symlinkPath, ["init", "--agents", "pi", "--no-install"], preserveRepo);
  assertCliSuccess(preserveResult, "henshusha init preserving unrelated skills");
  assert(existsSync(path.join(customSkillDir, "SKILL.md")), "unrelated Claude skills must be preserved");
  assert(
    existsSync(path.join(preserveRepo, ".pi", "skills", "henshusha-render", "SKILL.md")),
    "expected Pi henshusha skills while preserving unrelated Claude skills"
  );

  const allAgentsRepo = path.join(tmpRoot, "all-agents-repo");
  mkdirSync(allAgentsRepo, { recursive: true });
  writeFileSync(path.join(allAgentsRepo, "package.json"), '{"name":"all-agents"}\n', "utf8");
  assert(spawnSync("git", ["init", "--initial-branch=main"], { cwd: allAgentsRepo, encoding: "utf8" }).status === 0);
  const allAgentsResult = runCli(symlinkPath, ["init", "--all-agents", "--no-install"], allAgentsRepo);
  assertCliSuccess(allAgentsResult, "henshusha init --all-agents");
  assert(existsSync(path.join(allAgentsRepo, ".claude", "skills", "henshusha-render", "SKILL.md")), "--all-agents must install Claude skills");
  assert(existsSync(path.join(allAgentsRepo, ".codex", "skills", "henshusha-render", "SKILL.md")), "--all-agents must install Codex skills");
  assert(existsSync(path.join(allAgentsRepo, ".pi", "skills", "henshusha-render", "SKILL.md")), "--all-agents must install Pi skills");

  const unknownAgentResult = runCli(symlinkPath, ["init", "--agents", "unknown", "--no-install"], piOnlyRepo);
  assert(unknownAgentResult.status !== 0, "unknown agent runtime must fail");
  assert(
    /Unknown agent runtime/i.test(unknownAgentResult.stderr) || /Unknown agent runtime/i.test(unknownAgentResult.stdout),
    `expected actionable unknown-agent error, got:\n${unknownAgentResult.stdout}\n${unknownAgentResult.stderr}`
  );

  const conflictResult = runCli(symlinkPath, ["init", "--agents", "pi", "--no-skills", "--no-install"], piOnlyRepo);
  assert(conflictResult.status !== 0, "conflicting agent flags must fail");

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
