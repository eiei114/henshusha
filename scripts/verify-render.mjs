#!/usr/bin/env node
import { access, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const fixtureRoot = path.join(repoRoot, ".fixtures/basic-workspace");
const projectRoot = path.join(fixtureRoot, "projects/sample-video");
const outputPath = path.join(projectRoot, "renders/output.mp4");
const cliEntry = path.join(repoRoot, "packages/henshusha/dist/index.js");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error([`${command} ${args.join(" ")}`, stderr || stdout].filter(Boolean).join("\n")));
    });
  });
}

async function runNode(args, cwd = repoRoot) {
  const result = await run("node", args, { cwd });
  return result.stdout + result.stderr;
}

async function ffprobeJson(target) {
  const { stdout } = await run("ffprobe", [
    "-hide_banner",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    target
  ]);
  return JSON.parse(stdout);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("verify-render: doctor");
  const doctorOutput = await runNode([cliEntry, "doctor"], fixtureRoot);
  assert(/ffmpeg:\s*ok/i.test(doctorOutput), "doctor did not report ffmpeg as available");

  console.log("verify-render: fixture + sample media");
  await runNode([path.join(repoRoot, "scripts/create-fixture.mjs")]);
  await runNode([path.join(repoRoot, "scripts/create-sample-media.mjs"), "--force"]);

  console.log("verify-render: render");
  await runNode([cliEntry, "render", "projects/sample-video"], fixtureRoot);
  assert(await exists(outputPath), `missing render output: ${outputPath}`);

  const info = await stat(outputPath);
  assert(info.size > 0, "render output is empty");

  console.log("verify-render: ffprobe");
  const probe = await ffprobeJson(outputPath);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const audio = probe.streams?.find((stream) => stream.codec_type === "audio");
  assert(video?.codec_name === "h264", `expected h264 video, got ${video?.codec_name ?? "none"}`);
  assert(Number(video?.width) === 1080 && Number(video?.height) === 1920, "expected 1080x1920 output");
  assert(audio?.codec_name === "aac", `expected aac audio, got ${audio?.codec_name ?? "none"}`);
  assert(Number.parseFloat(probe.format?.duration ?? "0") >= 9.5, "expected ~10s output duration");

  console.log("verify-render: ok");
  console.log(`output: ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
