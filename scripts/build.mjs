#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const packagesDir = path.join(root, "packages");
const packageNames = (await readdir(packagesDir)).sort();
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

for (const packageName of packageNames) {
  const tsconfig = path.join(packagesDir, packageName, "tsconfig.json");
  console.log(`build ${packageName}`);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tscBin, "-p", tsconfig], {
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`build failed for ${packageName} with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}
