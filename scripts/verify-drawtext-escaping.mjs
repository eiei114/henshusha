#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const distEntry = path.join(repoRoot, "packages", "henshusha", "dist", "index.js");

function runCLI(args, cwd) {
  return spawnSync(process.execPath, [distEntry, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30_000
  });
}

function assertCliSuccess(result, label) {
  assert(!result.error, result.error?.code === "ETIMEDOUT"
    ? `${label} timed out after 30s`
    : `${label} failed to start\n${result.error?.message ?? "unknown error"}`);
  assert(result.status === 0, `${label} exited with ${result.status ?? "null"}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function runFfmpeg(args, cwd) {
  return spawnSync("ffmpeg", args, { cwd, encoding: "utf8", timeout: 60_000 });
}

const tmpDir = mkdtempSync(path.join(tmpdir(), "henshusha-drawtext-"));
try {
  const projectRoot = path.join(tmpDir, "project");
  const timelinesDir = path.join(projectRoot, "timelines");
  mkdirSync(timelinesDir, { recursive: true });

  // Timeline with required special characters in caption text: apostrophe, percent, colon, backslash.
  // A minimal video track is required so render dry-run can build a plan.
  const timeline = {
    version: "0.1",
    source: { path: "sources/raw/input.mp4" },
    timeline: {
      duration: 5,
      tracks: [
        {
          id: "video",
          type: "video",
          items: [
            {
              source: "sources/raw/input.mp4",
              sourceStart: 0,
              start: 0,
              end: 5
            }
          ]
        },
        {
          id: "captions",
          type: "caption",
          items: [
            {
              start: 0,
              end: 5,
              text: "It's 50% off: C:\\temp\\{now}"
            }
          ]
        },
        {
          id: "titles",
          type: "title",
          items: [
            {
              start: 0,
              end: 5,
              text: "First line\nSecond line"
            }
          ]
        }
      ]
    },
    render: {
      output: "renders/output.mp4",
      variant: { aspect: "16:9", resolution: "1920x1080" }
    }
  };

  writeFileSync(path.join(timelinesDir, "main.timeline.json"), JSON.stringify(timeline, null, 2), "utf8");

  const renderResult = runCLI(["render", projectRoot, "--dry-run"], tmpDir);
  assertCliSuccess(renderResult, "henshusha render --dry-run");

  const planPath = path.join(projectRoot, "jobs", "render-plan.json");
  assert(existsSync(planPath), `render plan not found at ${planPath}`);

  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const filterComplex = plan.ffmpeg?.args?.[plan.ffmpeg.args.indexOf("-filter_complex") + 1] ?? "";
  const command = plan.ffmpeg?.command ?? "";
  const textFiles = [...filterComplex.matchAll(/textfile='([^']+)'/g)].map((match) => match[1]);

  console.log("filter_complex:", filterComplex);
  console.log("command:", command);
  console.log("cwd:", plan.ffmpeg?.cwd);

  assert(filterComplex.includes("drawtext="), `expected drawtext in filter_complex, got: ${filterComplex}`);
  assert(plan.ffmpeg?.cwd === projectRoot, `FFmpeg cwd must be the project root so relative text files resolve, got: ${plan.ffmpeg?.cwd}`);
  assert(textFiles.length === 2, `expected a textfile option for each overlay, got: ${JSON.stringify(textFiles)}`);
  assert(!/:text=/.test(filterComplex), `user text must not be embedded in the filtergraph: ${filterComplex}`);
  assert((filterComplex.match(/expansion=none/g) ?? []).length === 2,
    `each drawtext filter must include expansion=none, got: ${filterComplex}`);
  assert(filterComplex.indexOf("expansion=none") < filterComplex.indexOf("textfile="),
    `expansion=none must precede textfile, got: ${filterComplex}`);
  assert(readFileSync(path.join(projectRoot, textFiles[0]), "utf8") === "It's 50% off: C:\\temp\\{now}",
    "the UTF-8 sidecar must preserve apostrophe, percent, colon, and backslash characters exactly");
  assert(readFileSync(path.join(projectRoot, textFiles[1]), "utf8") === "First line\nSecond line",
    "the UTF-8 sidecar must preserve an actual LF between title lines");

  if (process.argv.includes("--ffmpeg")) {
    const version = runFfmpeg(["-version"], projectRoot);
    assert(!version.error && version.status === 0, "--ffmpeg requested, but ffmpeg -version did not succeed");
    console.log("FFmpeg:", version.stdout.split(/\r?\n/, 1)[0]);

    const inputPath = path.join(projectRoot, "sources", "raw", "input.mp4");
    mkdirSync(path.dirname(inputPath), { recursive: true });
    const source = runFfmpeg([
      "-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
      "color=c=black:s=320x240:d=5:r=25", "-c:v", "libx264", "-pix_fmt", "yuv420p", inputPath
    ], projectRoot);
    assert(!source.error && source.status === 0,
      `could not create FFmpeg test source\nstdout:\n${source.stdout}\nstderr:\n${source.stderr}`);

    const parser = runFfmpeg([
      "-hide_banner", "-loglevel", "debug", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=5:r=25",
      "-filter_complex", filterComplex, "-map", "[txt1]", "-frames:v", "1", "-f", "null", "-"
    ], projectRoot);
    const parserLog = `${parser.stdout}\n${parser.stderr}`;
    assert(!parser.error && parser.status === 0,
      `FFmpeg filtergraph/drawtext parser check failed\nstdout:\n${parser.stdout}\nstderr:\n${parser.stderr}`);
    for (const option of ["textfile", "expansion", "fontsize", "enable"]) {
      assert(parserLog.includes(`Setting '${option}' to value`),
        `FFmpeg debug log must show '${option}' as a parsed option\n${parserLog}`);
    }
    assert(!/Stray %/i.test(parserLog), `FFmpeg reported a stray percent sign\n${parserLog}`);
    for (const line of parserLog.split(/\r?\n/)) {
      if (/Setting '(?:textfile|expansion|fontsize|enable)' to value|text_w:/.test(line)) console.log("FFmpeg parser:", line.trim());
    }
    console.log("FFmpeg parser: no Stray % warning");

    const render = runCLI(["render", projectRoot], tmpDir);
    assertCliSuccess(render, "henshusha render with FFmpeg");
    const outputPath = path.join(projectRoot, "renders", "output.mp4");
    assert(existsSync(outputPath) && statSync(outputPath).size > 0, "render did not produce a non-empty MP4");
    assert(!/Stray %/i.test(`${render.stdout}\n${render.stderr}`), "real render emitted a stray percent warning");
    console.log(`verify-drawtext-escaping ffmpeg render: ok (${statSync(outputPath).size} bytes)`);
  }

  console.log("verify-drawtext-escaping: ok");
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
