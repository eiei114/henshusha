#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const packagesDir = path.join(root, "packages");
const packageNames = (await readdir(packagesDir)).sort();
const typecheckOrder = ["timeline", ...packageNames.filter((name) => name !== "timeline")];
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

async function runTsc(packageName, noEmit) {
  const tsconfig = path.join(packagesDir, packageName, "tsconfig.json");
  const args = [tscBin, "-p", tsconfig];
  if (noEmit) args.push("--noEmit");
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`typecheck failed for ${packageName} with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

console.log("build timeline (typecheck prerequisite)");
await runTsc("timeline", false);

for (const packageName of typecheckOrder) {
  console.log(`typecheck ${packageName}`);
  await runTsc(packageName, true);
}
