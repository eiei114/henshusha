#!/usr/bin/env node
import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const packagesDir = path.join(root, "packages");
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
const packageNames = (await readdir(packagesDir)).sort();
const buildOrder = ["timeline", ...packageNames.filter((name) => name !== "timeline")];

async function runTsc(packageName) {
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

for (const packageName of buildOrder) {
  await runTsc(packageName);
}

const timelineDist = path.join(packagesDir, "timeline", "dist");
const vendorDist = path.join(packagesDir, "henshusha", "dist", "timeline");
await cp(timelineDist, vendorDist, { recursive: true });

const henshushaIndex = path.join(packagesDir, "henshusha", "dist", "index.js");
const henshushaIndexMap = path.join(packagesDir, "henshusha", "dist", "index.js.map");
const rewrittenImport = "./timeline/index.js";
for (const targetPath of [henshushaIndex, henshushaIndexMap]) {
  const contents = await readFile(targetPath, "utf8");
  await writeFile(targetPath, contents.replaceAll("../../timeline/dist/index.js", rewrittenImport), "utf8");
}

console.log("vendored @henshusha/timeline into packages/henshusha/dist/timeline");
