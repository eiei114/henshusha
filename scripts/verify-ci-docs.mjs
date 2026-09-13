#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const ciYaml = readFileSync(path.join(repoRoot, ".github", "workflows", "ci.yml"), "utf8");
const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

const ciCommands = [...ciYaml.matchAll(/^\s+run: (pnpm [^\n]+)/gm)]
  .map((match) => match[1])
  .filter((command) => !command.includes("install"));

assert(ciCommands.length > 0, "ci.yml must define pnpm check commands");

const ciSectionMatch = readme.match(/\*\*CI\*\* runs[^\n]+/);
assert(ciSectionMatch, "README must document CI fast checks in the CI and automation section");

const ciSection = ciSectionMatch[0];
for (const command of ciCommands) {
  const script = command.replace(/^pnpm\s+/, "");
  assert(
    ciSection.includes(`pnpm ${script}`),
    `README CI bullet must mention \`pnpm ${script}\` (from ci.yml: ${command})`
  );
}

console.log("CI docs verification passed.");
