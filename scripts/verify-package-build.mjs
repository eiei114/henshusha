#!/usr/bin/env node
import assert from "node:assert/strict";
import { runTypeScriptPackages } from "./package-build.mjs";

const firstFailure = new Error("first package failure");
const laterFailure = new Error("later package failure");
let rejectFirst;
const firstPackage = new Promise((resolve, reject) => {
  rejectFirst = reject;
});
const laterPackage = Promise.reject(laterFailure);
const startedPackages = [];
const pendingRun = runTypeScriptPackages(["first", "later"], (packageName) => {
  startedPackages.push(packageName);
  return packageName === "first" ? firstPackage : laterPackage;
});

assert.deepEqual(startedPackages, ["first", "later"], "all package jobs should start together");
let runSettled = false;
pendingRun.then(
  () => {
    runSettled = true;
  },
  () => {
    runSettled = true;
  }
);
await Promise.resolve();
assert.equal(runSettled, false, "the batch should wait for every package job to settle");
rejectFirst(firstFailure);
await assert.rejects(pendingRun, (error) => error === firstFailure);

const successfulPackages = [];
await runTypeScriptPackages(["timeline", "core"], async (packageName) => {
  successfulPackages.push(packageName);
});
assert.deepEqual(successfulPackages, ["timeline", "core"], "successful batches should run each package");

console.log("Package build orchestration regression passed.");
