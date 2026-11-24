import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../packages/henshusha/dist/index.js", import.meta.url));
const fixturePath = new URL("../packages/henshusha/templates/basic/projects/sample-video/timelines/main.timeline.json", import.meta.url);
const tempDir = mkdtempSync(path.join(realpathSync(tmpdir()), "henshusha-dry-run-audio-"));
const noAudioWarning = "Warning: source has no audio stream; rendering video-only output";

function fakeProbe(sourcePath, hasAudio) {
  // Intercept the CLI's spawn in its own Node process; no media or binaries are needed.
  return `data:text/javascript,${encodeURIComponent(`
    import assert from "node:assert/strict";
    import childProcess from "node:child_process";
    import { EventEmitter } from "node:events";
    import { syncBuiltinESMExports } from "node:module";

    let probes = 0;
    childProcess.spawn = (command, args) => {
      assert.equal(command, "ffprobe", "dry run may only spawn the audio probe");
      assert.equal(args.at(-1), ${JSON.stringify(sourcePath)});
      // A second probe would disagree with the first.
      const hasAudio = ++probes === 1 ? ${hasAudio} : ${!hasAudio};
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      queueMicrotask(() => {
        if (hasAudio) child.stdout.emit("data", Buffer.from("audio\\n"));
        child.emit("exit", 0);
      });
      return child;
    };
    syncBuiltinESMExports();
    process.on("exit", (code) => {
      if (code === 0) assert.equal(probes, 1, "expected one audio probe per dry run");
    });
  `)}`;
}

function verifyDryRun(hasAudio, planOutput) {
  const projectDir = path.join(tempDir, hasAudio ? "audio" : "video-only");
  const timelinePath = path.join(projectDir, "timelines", "main.timeline.json");
  const sourcePath = path.join(projectDir, "sources", "raw", "input.mp4");
  const outputPath = path.join(projectDir, "renders", "output.mp4");
  const relativePlanPath = planOutput ?? path.join("jobs", "render-plan.json");
  mkdirSync(path.dirname(timelinePath), { recursive: true });
  copyFileSync(fixturePath, timelinePath);

  const result = spawnSync(process.execPath, [
    "--import", fakeProbe(sourcePath, hasAudio), cliPath, "render", ".", "--dry-run",
    ...(planOutput ? ["--plan-output", planOutput] : [])
  ], { cwd: projectDir, encoding: "utf8", timeout: 60_000 });

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), `Wrote render plan: ${relativePlanPath}`);
  assert.equal(result.stderr.split(/\r?\n/).filter((line) => line === noAudioWarning).length, hasAudio ? 0 : 1);
  assert.equal(existsSync(outputPath), false);

  const plan = JSON.parse(readFileSync(path.join(projectDir, relativePlanPath), "utf8"));
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.kind, "henshusha.render-plan");
  assert.equal(plan.dryRun, true);
  assert.equal(plan.timelinePath, timelinePath);
  assert.equal(plan.outputPath, outputPath);
  assert.equal(plan.ffmpeg.hasAudio, hasAudio);

  const args = plan.ffmpeg.args;
  const filters = args[args.indexOf("-filter_complex") + 1];
  assert.equal(filters.includes("[0:a]atrim="), hasAudio);
  assert.match(filters, hasAudio ? /:v=1:a=1\[cv\]\[ca\]/ : /:v=1:a=0\[cv\]/);
  assert.deepEqual(args.filter((arg, index) => args[index - 1] === "-map" && arg === "[ca]"), hasAudio ? ["[ca]"] : []);
  assert.equal(args.includes("-c:a"), hasAudio);
  if (hasAudio) assert.equal(args[args.indexOf("-c:a") + 1], "aac");
  assert.equal(args.at(-1), outputPath);
}

try {
  verifyDryRun(true);
  verifyDryRun(false, path.join("custom", "video-only.json"));
  console.log("Verified one audio probe per dry run and matching warnings, plan, and FFmpeg args (audio and video-only).");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
