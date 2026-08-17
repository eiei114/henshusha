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

assert(
  /package-ecosystem:\s*npm/.test(config),
  "expected npm dependabot config block"
);

const lines = config.split(/\r?\n/);
const commitMessageBlocks = [];
for (let index = 0; index < lines.length; index += 1) {
  const match = lines[index].match(/^(\s*)commit-message:\s*$/);
  if (!match) continue;

  const indent = match[1].length;
  const blockLines = [lines[index]];
  for (let next = index + 1; next < lines.length; next += 1) {
    const line = lines[next];
    const lineIndent = line.match(/^\s*/)[0].length;
    if (line.trim() && lineIndent <= indent) break;
    blockLines.push(line);
  }
  commitMessageBlocks.push(blockLines.join("\n"));
}

assert(commitMessageBlocks.length > 0, "expected dependabot commit-message block");

for (const commitMessage of commitMessageBlocks) {
  const prefix = commitMessage.match(/^\s*prefix:\s*(.+?)\s*$/m)?.[1] ?? "";
  assert(
    !/\([^)]*\)/.test(prefix) || !/^\s*include:\s*scope\s*$/m.test(commitMessage),
    `dependabot commit-message with prefix ${prefix} must not set include: scope; that produces double-scoped titles`
  );
}

console.log("Dependabot config verification passed.");
