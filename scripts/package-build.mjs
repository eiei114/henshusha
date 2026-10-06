import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

export async function getTypeScriptPackageOrder(packagesDir) {
  const packageNames = (await readdir(packagesDir)).sort();
  return ["timeline", ...packageNames.filter((name) => name !== "timeline")];
}

export async function runTypeScript({ packageName, packagesDir, tscBin, noEmit, operation }) {
  const tsconfig = path.join(packagesDir, packageName, "tsconfig.json");
  const args = [tscBin, "-p", tsconfig];
  if (noEmit) args.push("--noEmit");
  console.log(`${operation} ${packageName}`);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${operation} failed for ${packageName} with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}
