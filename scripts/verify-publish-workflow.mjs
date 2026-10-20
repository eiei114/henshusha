#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const workflowPath = path.join(repoRoot, ".github", "workflows", "publish-henshusha.yml");
const workflowText = readFileSync(workflowPath, "utf8");
const document = parseDocument(workflowText, { schema: "core" });

assert.equal(document.errors.length, 0, `Publish workflow YAML must parse: ${document.errors[0]?.message}`);

const workflow = document.toJS();
const events = workflow.on;
assert.deepEqual(
  Object.keys(events ?? {}),
  ["workflow_dispatch"],
  "Publishing must not run automatically on push, including merges to main"
);

const approval = events.workflow_dispatch.inputs?.confirm_release;
assert.equal(approval?.type, "boolean", "Manual dispatch must request an explicit boolean release approval");
assert.equal(approval?.required, true, "Release approval must be required for manual dispatch");
assert.equal(approval?.default, false, "Release approval must default to denied");

const jobs = workflow.jobs ?? {};
assert.equal(
  Object.keys(jobs).length,
  1,
  "All publishing, tagging, and release operations must remain in the single guarded job"
);

const publishJob = jobs.publish;
assert.equal(
  publishJob?.if,
  "github.ref == 'refs/heads/main' && inputs.confirm_release",
  "The release job must require both the main branch and explicit approval"
);

const steps = publishJob.steps ?? [];
const publishStep = steps.find((step) => step.run?.includes("npm publish "));
assert(publishStep, "The guarded release job must contain the npm publish command");
assert.equal(
  publishStep.if,
  "steps.exists.outputs.exists == 'false'",
  "npm publish must only run when the package version is not already published"
);
assert(
  publishStep["continue-on-error"] === undefined || publishStep["continue-on-error"] === false,
  "npm publish failures must fail the release job and stop later release steps"
);

assert(
  steps.some((step) => step.name === "Create version tag" && step.run?.includes('git push origin "$TAG"')),
  "The guarded release job must contain the version tag push"
);
assert(
  steps.some((step) => step.name === "Create GitHub release" && step.run?.includes("gh release create")),
  "The guarded release job must contain the GitHub release command"
);

console.log("Publish workflow safety verification passed.");
