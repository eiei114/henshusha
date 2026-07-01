#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const fixtureRoot = path.resolve(".fixtures", "basic-workspace");
const exampleRoot = path.resolve("examples", "basic-workspace");
const force = process.argv.includes("--force");

if (force) {
  await rm(fixtureRoot, { recursive: true, force: true });
}

await mkdir(path.dirname(fixtureRoot), { recursive: true });
await cp(exampleRoot, fixtureRoot, { recursive: true, force: true });

console.log(`Created fixture at ${fixtureRoot}`);
console.log("Next: open the fixture in Claude Code, Codex, or Pi and dogfood the skills workflow.");
