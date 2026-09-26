#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const ciWorkflow = readFileSync(path.join(repoRoot, ".github", "workflows", "ci.yml"), "utf8");
const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

const workflowLines = ciWorkflow.split(/\r?\n/);

function removeYamlComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "\\" && quote === '"') {
      index += 1;
      continue;
    }
    if ((character === '"' || character === "'") && (quote === null || quote === character)) {
      quote = quote === null ? character : null;
    }
    if (character === "#" && quote === null && (index === 0 || /\s/.test(value[index - 1]))) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value.trimEnd();
}

function parseYamlString(value, context) {
  const trimmed = removeYamlComment(value).trim();
  assert(trimmed, `${context} must contain only string entries`);
  if (trimmed.startsWith('"')) {
    assert(trimmed.endsWith('"'), `${context} must contain only string entries`);
    try {
      return JSON.parse(trimmed);
    } catch {
      assert(false, `${context} must contain only string entries`);
    }
  }
  if (trimmed.startsWith("'")) {
    assert(trimmed.endsWith("'"), `${context} must contain only string entries`);
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  assert(
    !/^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?)$/i.test(trimmed) &&
      !/^[{[&*!|>]/.test(trimmed) &&
      !/^[^:]+:\s/.test(trimmed),
    `${context} must contain only string entries`
  );
  return trimmed;
}

function parseYamlStringList(lines, parentIndent, context) {
  const firstEntry = lines.find((line) => line.trim() && !/^\s*#/.test(line));
  assert(firstEntry, `${context} must contain only string entries`);
  const entryIndent = firstEntry.match(/^ */)[0].length;
  const entries = [];
  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.match(/^ */)[0].length;
    if (indent <= parentIndent) break;
    assert(indent === entryIndent, `${context} contains invalid entry: ${line.trim()}`);
    const match = line.match(/^\s*-\s*(.*)$/);
    assert(match, `${context} contains invalid entry: ${line.trim()}`);
    entries.push(parseYamlString(match[1], context));
  }
  return entries;
}

function eventPaths(eventName) {
  const eventStart = workflowLines.findIndex((line) => line === `  ${eventName}:`);
  assert(eventStart >= 0, `ci.yml must define the ${eventName} event`);

  const eventLines = [];
  for (let index = eventStart + 1; index < workflowLines.length; index += 1) {
    const line = workflowLines[index];
    if (line.trim() && (line.match(/^ */)?.[0].length ?? 0) <= 2) break;
    eventLines.push(line);
  }

  const pathsStart = eventLines.findIndex((line) => line === "    paths:");
  assert(pathsStart >= 0, `ci.yml must define ${eventName}.paths`);
  return parseYamlStringList(eventLines.slice(pathsStart + 1), 4, `ci.yml ${eventName}.paths`);
}

const requiredPathPatterns = ["docs/**", "README.md"];
for (const eventName of ["pull_request", "push"]) {
  const paths = eventPaths(eventName);
  for (const pathPattern of requiredPathPatterns) {
    assert(
      paths.includes(pathPattern),
      `ci.yml ${eventName}.paths must include ${pathPattern} so documentation regressions are checked`
    );
  }
}

const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));

const ciScripts = [...ciWorkflow.matchAll(/^\s+run:\s+pnpm\s+([^\s#]+)/gm)]
  .map((match) => match[1])
  .filter((script) => packageScripts.has(script));
assert(ciScripts.length > 0, "ci.yml must declare at least one package.json script via pnpm");

const ciSectionMatch = readme.match(/## CI and automation\r?\n([\s\S]*?)(?:\r?\n## |\r?\n$)/);
assert(ciSectionMatch, "README.md must include a ## CI and automation section");
const ciSection = ciSectionMatch[1];

const ciBulletMatch = ciSection.match(/^\s*-\s+\*\*CI\*\*[^\n]*/m);
assert(ciBulletMatch, "README CI section must include a **CI** bullet describing fast checks");
const ciBullet = ciBulletMatch[0];

for (const script of ciScripts) {
  assert(
    ciBullet.includes(`\`pnpm ${script}\``),
    `README CI bullet must mention \`pnpm ${script}\` to match .github/workflows/ci.yml`
  );
}

console.log("CI docs verification passed.");
