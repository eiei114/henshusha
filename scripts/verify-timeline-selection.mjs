import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../packages/henshusha/dist/index.js", import.meta.url));
const fixturePath = new URL("../packages/henshusha/templates/basic/projects/sample-video/timelines/main.timeline.json", import.meta.url);
// A child process may report its cwd with symlinks or junctions resolved.
const projectDir = mkdtempSync(path.join(realpathSync(tmpdir()), "henshusha-timeline-selection-"));
const timelinesDir = path.join(projectDir, "timelines");

// Filesystems may already enumerate in lexical order regardless of creation order.
// Force reverse order only for this project's timeline directory in the CLI process.
const reverseReaddir = `data:text/javascript,${encodeURIComponent(`
  import fs from "node:fs/promises";
  import { syncBuiltinESMExports } from "node:module";
  const readdir = fs.readdir;
  let reversed = false;
  fs.readdir = async (dir, ...options) => {
    const entries = await readdir(dir, ...options);
    if (dir !== ${JSON.stringify(timelinesDir)}) return entries;
    reversed = true;
    return entries.sort().reverse();
  };
  syncBuiltinESMExports();
  process.on("exit", (code) => {
    if (code === 0 && !reversed) {
      console.error("The fallback test did not force reverse timeline enumeration.");
      process.exitCode = 1;
    }
  });
`)}`;

function expectTimeline(relativePath, nodeArgs = [], cliArgs = []) {
  const result = spawnSync(process.execPath, [...nodeArgs, cliPath, "validate", ".", ...cliArgs], {
    cwd: projectDir,
    encoding: "utf8",
    timeout: 60_000
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), `Valid timeline: ${relativePath}`);
}

try {
  mkdirSync(timelinesDir);
  for (const name of ["z.timeline.json", "a.timeline.json"]) {
    copyFileSync(fixturePath, path.join(timelinesDir, name));
  }
  expectTimeline(path.join("timelines", "a.timeline.json"), ["--import", reverseReaddir]);

  for (const name of ["sample.timeline.json", "main.timeline.json"]) {
    copyFileSync(fixturePath, path.join(timelinesDir, name));
    expectTimeline(path.join("timelines", name));
  }

  const explicit = path.join("timelines", "z.timeline.json");
  expectTimeline(explicit, [], ["--timeline", explicit]);

  console.log("Verified lexical fallback timeline selection and explicit, main, and sample precedence.");
} finally {
  rmSync(projectDir, { recursive: true, force: true });
}
