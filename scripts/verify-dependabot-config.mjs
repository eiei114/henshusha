#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(scriptDir, "..", ".github", "dependabot.yml");
const config = readFileSync(configPath, "utf8");

const npmBlock = config.match(
  /package-ecosystem:\s*npm[\s\S]*?(?=\n\s{2}-\s+package-ecosystem:|$)/
);
assert(npmBlock, "expected npm dependabot config block");

const commitMessageBlock = npmBlock[0].match(/commit-message:[\s\S]*?(?=\n\s{4}[a-z-]+:|$)/);
assert(commitMessageBlock, "expected npm commit-message block");

const commitMessage = commitMessageBlock[0];
assert(
  !/include:\s*scope/.test(commitMessage),
  "npm dependabot commit-message must not set include: scope when prefix already carries chore(deps); that produces chore(deps)(deps-dev) titles"
);

console.log("Dependabot config verification passed.");
