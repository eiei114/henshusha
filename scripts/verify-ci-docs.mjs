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
  const paths = [];
  for (const line of eventLines.slice(pathsStart + 1)) {
    if (!line.trim()) continue;
    if (/^\s*#/.test(line.trim())) continue;
    const bareItem = line.match(/^      -\s*$/);
    assert(!bareItem, `ci.yml ${eventName}.paths must contain only string entries`);
    const pathMatch = line.match(/^      -\s+(.+)$/);
    if (!pathMatch) {
      const stillInPathsBlock = (line.match(/^ */)?.[0].length ?? 0) >= 6;
      assert(!stillInPathsBlock, `ci.yml ${eventName}.paths contains invalid entry: ${line.trim()}`);
      break;
    }
    paths.push(pathMatch[1].replace(/^(["'])(.*)\1$/, "$2"));
  }
  return paths;
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
