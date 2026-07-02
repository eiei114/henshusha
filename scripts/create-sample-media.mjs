#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const defaultTarget = path.resolve(
  ".fixtures/basic-workspace/projects/sample-video/sources/raw/input.mp4"
);

function parseTarget(argv) {
  const force = argv.includes("--force");
  const positional = argv.filter((value) => !value.startsWith("-"));
  return {
    target: path.resolve(positional[0] ?? defaultTarget),
    force
  };
}

async function runCommand(command, args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function createSampleMedia(target, force) {
  await mkdir(path.dirname(target), { recursive: true });
  const args = [
    "-y",
    ...(force ? [] : ["-n"]),
    "-f",
    "lavfi",
    "-i",
    "color=c=blue:s=640x360:d=10",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=10",
    "-shortest",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    target
  ];
  await runCommand("ffmpeg", args);
}

const { target, force } = parseTarget(process.argv.slice(2));

try {
  await createSampleMedia(target, force);
  console.log(`Created sample media at ${target}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!force && /File exists|already exists/i.test(message)) {
    console.log(`Sample media already exists at ${target}`);
    process.exit(0);
  }
  console.error(`Failed to create sample media: ${message}`);
  console.error("ffmpeg is required. Install from https://ffmpeg.org/download.html");
  process.exit(1);
}
