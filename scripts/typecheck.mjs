#!/usr/bin/env node
import path from "node:path";
import { getTypeScriptPackageOrder, runTypeScript } from "./package-build.mjs";

const root = process.cwd();
const packagesDir = path.join(root, "packages");
const typecheckOrder = await getTypeScriptPackageOrder(packagesDir);
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
const runTypecheck = (packageName) =>
  runTypeScript({ packageName, packagesDir, tscBin, operation: "typecheck", noEmit: true });

console.log("build timeline (typecheck prerequisite)");
await runTypeScript({ packageName: "timeline", packagesDir, tscBin, operation: "build", noEmit: false });

const typecheckResults = await Promise.allSettled(typecheckOrder.map(runTypecheck));
const failedTypecheck = typecheckResults.find((result) => result.status === "rejected");
if (failedTypecheck) throw failedTypecheck.reason;
