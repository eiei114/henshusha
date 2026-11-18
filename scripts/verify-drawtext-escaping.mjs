#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const tmpDir = mkdtempSync(path.join(tmpdir(), "henshusha-drawtext-"));
try {
  const projectRoot = path.join(tmpDir, "project");
  const timelinesDir = path.join(projectRoot, "timelines");
  mkdirSync(timelinesDir, { recursive: true });

  // Timeline with required special characters in caption text: apostrophe, percent, colon.
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
              text: "It's 50% off: {now}"
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

  console.log("filter_complex:", filterComplex);
  console.log("command:", command);

  assert(filterComplex.includes("drawtext="), `expected drawtext in filter_complex, got: ${filterComplex}`);
  assert(filterComplex.includes("expansion=none"), `drawtext filter must include expansion=none, got: ${filterComplex}`);
  // Apostrophe escaped as close-reopen pattern '\\'' (issue-specified equivalent)
  assert(filterComplex.includes("It'\\''s"), `drawtext filter must use FFmpeg close-reopen apostrophe escape '\\'', got: ${filterComplex}`);
  // Colon escaped and %/{now} kept literal with expansion=none
  assert(filterComplex.includes("50% off\\: {now}"), `drawtext filter must escape colon and keep %/{now} literal, got: ${filterComplex}`);
  // Full expected text value
  assert(filterComplex.includes("text='It'\\''s 50% off\\: {now}'"), `expected escaped text value, got: ${filterComplex}`);

  console.log("verify-drawtext-escaping: ok");
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
