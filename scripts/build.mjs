#!/usr/bin/env node
import { cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTypeScriptPackageOrder, runTypeScript } from "./package-build.mjs";

const root = process.cwd();
const packagesDir = path.join(root, "packages");
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
const buildOrder = await getTypeScriptPackageOrder(packagesDir);
const runBuild = (packageName) =>
  runTypeScript({ packageName, packagesDir, tscBin, operation: "build", noEmit: false });

await runBuild("timeline");
const buildResults = await Promise.allSettled(buildOrder.slice(1).map(runBuild));
const failedBuild = buildResults.find((result) => result.status === "rejected");
if (failedBuild) throw failedBuild.reason;

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
