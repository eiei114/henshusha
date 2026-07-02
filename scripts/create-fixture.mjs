#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const fixtureRoot = path.resolve(".fixtures", "basic-workspace");
const exampleRoot = path.resolve("examples", "basic-workspace");
const force = process.argv.includes("--force");

if (force) {
  await rm(fixtureRoot, { recursive: true, force: true });
}

await mkdir(path.dirname(fixtureRoot), { recursive: true });
await cp(exampleRoot, fixtureRoot, { recursive: true, force: true });

const sampleMediaScript = path.join(scriptDir, "create-sample-media.mjs");
const sampleTarget = path.join(fixtureRoot, "projects/sample-video/sources/raw/input.mp4");
await new Promise((resolve, reject) => {
  const child = spawn("node", [sampleMediaScript, sampleTarget, "--force"], {
    cwd: path.dirname(sampleMediaScript),
    stdio: "inherit",
    shell: false
  });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`create-sample-media exited with code ${code ?? "unknown"}`)));
});

console.log(`Created fixture at ${fixtureRoot}`);
console.log("Next: open the fixture in Claude Code, Codex, or Pi and dogfood the skills workflow.");
