import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../packages/henshusha/dist/index.js", import.meta.url));
const fixturePath = new URL("../packages/henshusha/templates/basic/projects/sample-video/timelines/main.timeline.json", import.meta.url);
const projectDir = mkdtempSync(path.join(tmpdir(), "henshusha-remotion-props-"));
const timelineName = "main.timeline.json";
const timelinePath = path.join(projectDir, timelineName);
const outputName = "remotion/timeline-props.json";
const propsPath = path.join(projectDir, outputName);
const missingOutput = "unused/timeline-props.json";

function run(fps, output) {
  const result = spawnSync(process.execPath, [cliPath, "remotion-props", ".", "--timeline", timelineName, "--fps", fps, "--output", output], {
    cwd: projectDir,
    encoding: "utf8",
    timeout: 60_000
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, null, `CLI terminated by ${result.signal}`);
  return result;
}

try {
  copyFileSync(fixturePath, timelinePath);
  const success = run("29.97", outputName);
  assert.equal(success.status, 0, success.stderr);
  const original = readFileSync(propsPath);
  assert.equal(JSON.parse(original.toString("utf8")).durationInFrames, 300);

  function assertRejected(fps, duration) {
    for (const output of [missingOutput, outputName]) {
      const result = run(fps, output);
      assert.notEqual(result.status, 0, `expected rejection at FPS ${fps}`);
      assert.match(result.stderr, /frame count.*positive safe integer/i);
      assert.ok(result.stderr.includes(`duration ${duration} seconds`), result.stderr);
      assert.ok(result.stderr.includes(`FPS ${Number(fps)}`), result.stderr);
      assert.equal(existsSync(path.join(projectDir, "unused")), false, "must not create an output directory");
      assert.deepEqual(readFileSync(propsPath), original, "must not overwrite props");
    }
  }

  assertRejected("1e15", 10); // Finite product exceeds Number.MAX_SAFE_INTEGER.
  assertRejected("1e308", 10); // Product overflows to Infinity.

  const tinyTimeline = JSON.parse(readFileSync(timelinePath, "utf8"));
  tinyTimeline.timeline.duration = Number.MIN_VALUE;
  writeFileSync(timelinePath, JSON.stringify(tinyTimeline));
  assertRejected("0.25", Number.MIN_VALUE); // Product underflows to zero.

  console.log("Verified remotion-props fractional FPS rounding and rejection of unsafe, overflowing, and zero frame counts without output changes.");
} finally {
  rmSync(projectDir, { recursive: true, force: true });
}
