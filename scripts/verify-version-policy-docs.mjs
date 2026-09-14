#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const rootVersion = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
const publishedVersion = JSON.parse(
  readFileSync(path.join(repoRoot, "packages/henshusha/package.json"), "utf8")
).version;

assert(rootVersion === "0.0.1", `root package.json version must stay 0.0.1, got ${rootVersion}`);
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
assert(
  typeof publishedVersion === "string" && SEMVER_PATTERN.test(publishedVersion),
  `packages/henshusha/package.json must define a valid published semver, got ${publishedVersion}`
);
assert(
  publishedVersion !== "0.0.1",
  "packages/henshusha/package.json must not reuse the private root version 0.0.1"
);

const contributing = readFileSync(path.join(repoRoot, "docs/contributing.md"), "utf8").toLowerCase();
assert(
  contributing.includes("version policy") || contributing.includes("version source"),
  "docs/contributing.md must document the monorepo version policy"
);
assert(
  contributing.includes("0.0.1") && contributing.includes("packages/henshusha"),
  "docs/contributing.md must explain root 0.0.1 vs packages/henshusha version"
);
assert(
  contributing.includes("publish-henshusha.yml") || contributing.includes("trusted publishing"),
  "docs/contributing.md must point contributors at the publish workflow"
);

console.log("Version policy docs verification passed.");
