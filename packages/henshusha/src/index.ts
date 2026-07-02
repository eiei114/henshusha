#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { access, cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const packageRoot = path.resolve(currentDir, "..");

type TrackType = "video" | "title" | "caption";
type Aspect = "16:9" | "9:16" | "1:1";

interface VideoItem { source?: string; start: number; end: number; sourceStart?: number }
interface TextItem { start: number; end: number; text: string; preset?: string; accent?: string; label?: string; speaker?: string }
interface Track { id: string; type: TrackType; items: Array<VideoItem | TextItem> }
interface Timeline {
  version: "0.1";
  source?: { path: string; audio?: string };
  timeline?: { duration?: number; tracks: Track[] };
  render: { output?: string; variant: { aspect: Aspect; resolution: string; safeArea?: string }; artDirection?: { preset?: string; captionStyle?: string } };
}

async function exists(target: string): Promise<boolean> {
  try { await access(target); return true; } catch { return false; }
}

async function findFirstExisting(candidates: string[]): Promise<string> {
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new Error(`Missing required scaffold source. Tried:\n${candidates.join("\n")}`);
}

async function copyDirectoryContents(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source)) {
    const sourcePath = path.join(source, entry);
    const destinationPath = path.join(destination, entry);
    const info = await stat(sourcePath);
    if (info.isDirectory()) await copyDirectoryContents(sourcePath, destinationPath);
    else await cp(sourcePath, destinationPath, { force: false, errorOnExist: false });
  }
}

async function copySkills(skillsSource: string, projectRoot: string): Promise<void> {
  for (const runtime of [".claude/skills", ".codex/skills", ".pi/skills"]) {
    await mkdir(path.join(projectRoot, runtime), { recursive: true });
    await copyDirectoryContents(skillsSource, path.join(projectRoot, runtime));
  }
}

function normalizePathForPackageJson(target: string): string {
  return target.split(path.sep).join("/");
}

async function workspaceCliDependency(projectRoot: string): Promise<string> {
  const localSourceEntry = path.join(packageRoot, "src", "index.ts");
  if (await exists(localSourceEntry)) {
    const relative = normalizePathForPackageJson(path.relative(projectRoot, packageRoot));
    const safeRelative = relative.startsWith(".") ? relative : `./${relative}`;
    return `file:${safeRelative}`;
  }
  return readPackageVersion();
}

async function updateWorkspacePackageJson(projectRoot: string, workspaceName: string): Promise<void> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await exists(packageJsonPath))) return;
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    name?: string;
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  packageJson.name = workspaceName;
  packageJson.scripts = {
    ...packageJson.scripts,
    "validate": "henshusha validate projects/sample-video",
    "render:dry-run": "henshusha render projects/sample-video --dry-run",
    "render": "henshusha render projects/sample-video",
    "remotion:props": "henshusha remotion-props projects/sample-video",
    "remotion:preview": "henshusha remotion-props projects/sample-video && remotion preview projects/sample-video/remotion/index.tsx",
    "remotion:render": "henshusha remotion-props projects/sample-video && remotion render projects/sample-video/remotion/index.tsx HenshushaTimeline projects/sample-video/renders/remotion-output.mp4",
    "new-project": "henshusha new-project",
    "doctor:updates": "henshusha doctor --updates"
  };
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "henshusha": await workspaceCliDependency(projectRoot)
  };
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

type PackageManager = "npm" | "pnpm" | "bun" | "yarn";

function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? "";
  const execPath = process.env.npm_execpath ?? "";
  if (userAgent.startsWith("bun/") || /bun/i.test(execPath)) return "bun";
  if (userAgent.startsWith("pnpm/") || /pnpm/i.test(execPath)) return "pnpm";
  if (userAgent.startsWith("yarn/") || /yarn/i.test(execPath)) return "yarn";
  return "npm";
}

function installCommand(packageManager: PackageManager): { command: string; args: string[] } {
  if (packageManager === "bun") return { command: "bun", args: ["install"] };
  if (packageManager === "pnpm") return { command: "pnpm", args: ["install"] };
  if (packageManager === "yarn") return { command: "yarn", args: ["install"] };
  return { command: "npm", args: ["install"] };
}

function spawnCommand(command: string, args: string[]): { command: string; args: string[] } {
  if (process.platform === "win32" && ["npm", "pnpm", "yarn"].includes(command)) {
    return { command: "cmd.exe", args: ["/d", "/s", "/c", command, ...args] };
  }
  return { command, args };
}

async function installWorkspaceDependencies(projectRoot: string, packageManager = detectPackageManager()): Promise<{ ok: boolean; command: string }> {
  const { command, args } = installCommand(packageManager);
  const display = [command, ...args].join(" ");
  console.log(`Installing workspace dependencies with ${display}...`);
  return await new Promise((resolve) => {
    const executable = spawnCommand(command, args);
    const child = spawn(executable.command, executable.args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false
    });
    child.on("error", (error) => {
      console.warn(`Dependency install failed to start: ${error.message}`);
      resolve({ ok: false, command: display });
    });
    child.on("exit", (code) => resolve({ ok: code === 0, command: display }));
  });
}

async function runGit(projectRoot: string, args: string[]): Promise<{ ok: boolean; command: string }> {
  const display = ["git", ...args].join(" ");
  return await new Promise((resolve) => {
    const child = spawn("git", args, {
      cwd: projectRoot,
      stdio: "ignore",
      shell: false
    });
    child.on("error", () => resolve({ ok: false, command: display }));
    child.on("exit", (code) => resolve({ ok: code === 0, command: display }));
  });
}

async function initializeGitRepository(projectRoot: string): Promise<{ ok: boolean; command: string }> {
  if (await exists(path.join(projectRoot, ".git"))) return { ok: true, command: "git init" };
  const initMain = await runGit(projectRoot, ["init", "--initial-branch=main"]);
  if (initMain.ok) return initMain;
  return await runGit(projectRoot, ["init"]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function isString(value: unknown): value is string { return typeof value === "string" && value.length > 0; }

function parseResolution(resolution: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/.exec(resolution);
  if (!match) throw new Error(`Invalid resolution: ${resolution}. Expected WIDTHxHEIGHT.`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function validateTimelineObject(value: unknown): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["timeline must be an object"], warnings };
  if (value.version !== "0.1") errors.push("version must be '0.1'");
  if (value.source !== undefined && (!isRecord(value.source) || !isString(value.source.path))) errors.push("source.path must be a non-empty string when source is set");
  if (!isRecord(value.render) || !isRecord(value.render.variant)) errors.push("render.variant is required");
  else {
    const variant = value.render.variant;
    if (!isString(variant.aspect) || !["16:9", "9:16", "1:1"].includes(variant.aspect)) errors.push("render.variant.aspect must be one of 16:9, 9:16, 1:1");
    if (!isString(variant.resolution)) errors.push("render.variant.resolution is required");
    else { try { parseResolution(variant.resolution); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); } }
  }
  if (!isRecord(value.timeline) || !Array.isArray(value.timeline.tracks)) errors.push("timeline.tracks is required for manual cut + overlay rendering");
  else {
    const tracks = value.timeline.tracks;
    const videoTracks = tracks.filter((track) => isRecord(track) && track.type === "video");
    if (videoTracks.length === 0) errors.push("timeline.tracks must include one video track");
    for (const [trackIndex, track] of tracks.entries()) {
      if (!isRecord(track)) { errors.push(`timeline.tracks[${trackIndex}] must be an object`); continue; }
      if (!isString(track.id)) errors.push(`timeline.tracks[${trackIndex}].id is required`);
      if (!["video", "title", "caption"].includes(String(track.type))) errors.push(`timeline.tracks[${trackIndex}].type must be video, title, or caption`);
      if (!Array.isArray(track.items)) { errors.push(`timeline.tracks[${trackIndex}].items must be an array`); continue; }
      for (const [itemIndex, item] of track.items.entries()) {
        if (!isRecord(item)) { errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}] must be an object`); continue; }
        if (!isNumber(item.start) || !isNumber(item.end) || item.end <= item.start) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}] must have valid start/end`);
        if (track.type === "video") {
          if (item.source !== undefined && !isString(item.source)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].source must be a string`);
          if (item.sourceStart !== undefined && !isNumber(item.sourceStart)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].sourceStart must be a number`);
        } else {
          if (!isString(item.text)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].text is required`);
          for (const key of ["preset", "accent", "label", "speaker"] as const) {
            if (item[key] !== undefined && !isString(item[key])) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].${key} must be a string`);
          }
        }
      }
    }
    const firstVideoTrack = videoTracks[0];
    if (isRecord(firstVideoTrack) && Array.isArray(firstVideoTrack.items)) {
      const sorted = [...firstVideoTrack.items].filter(isRecord).sort((a, b) => Number(a.start) - Number(b.start));
      for (let index = 0; index < sorted.length; index += 1) {
        const current = sorted[index];
        const previous = sorted[index - 1];
        if (current && Number(current.start) !== (index === 0 ? 0 : Number(previous?.end))) {
          warnings.push("video items are rendered in order as a concat; gaps/overlaps are not preserved yet"); break;
        }
      }
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

async function readTimeline(timelinePath: string): Promise<Timeline> {
  const parsed = JSON.parse(await readFile(timelinePath, "utf8")) as unknown;
  const result = validateTimelineObject(parsed);
  if (!result.ok) throw new Error(`Invalid Henshusha timeline:\n${result.errors.join("\n")}`);
  return parsed as Timeline;
}

function parseOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

const valueOptions = new Set(["--timeline", "--output", "--plan-output", "--fps"]);

function firstPositional(argv: string[], fallback: string): string {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value) continue;
    if (valueOptions.has(value)) {
      index += 1;
      continue;
    }
    if (value.startsWith("--")) continue;
    return value;
  }
  return fallback;
}

async function findTimelinePath(projectRoot: string, explicit?: string): Promise<string> {
  if (explicit) return path.isAbsolute(explicit) ? explicit : path.resolve(projectRoot, explicit);
  for (const name of ["main.timeline.json", "sample.timeline.json"]) {
    const candidate = path.join(projectRoot, "timelines", name);
    if (await exists(candidate)) return candidate;
  }
  const timelinesDir = path.join(projectRoot, "timelines");
  const first = (await readdir(timelinesDir)).find((entry) => entry.endsWith(".timeline.json"));
  if (!first) throw new Error(`No timeline found under ${timelinesDir}`);
  return path.join(timelinesDir, first);
}

function projectPath(projectRoot: string, relativePath: string): string {
  return path.isAbsolute(relativePath) ? relativePath : path.resolve(projectRoot, relativePath);
}

function ffmpegText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n");
}

function defaultFontFile(): string | undefined {
  if (process.platform !== "win32") return undefined;
  return "C\\:/Windows/Fonts/meiryo.ttc";
}

function drawText(item: TextItem, type: TrackType): string {
  const preset = item.preset ?? (type === "title" ? "bold-center" : "bottom-caption");
  const isLowerThird = preset === "lower-third";
  const isQuoteCard = preset === "quote-card";
  const isBottom = !isQuoteCard && (isLowerThird || preset.includes("bottom") || preset.includes("caption") || type === "caption");
  const fontSize = isBottom ? 54 : 76;
  const x = isLowerThird ? "w*0.08" : "(w-text_w)/2";
  const y = isBottom ? "h-(text_h*3)" : "(h-text_h)/2";
  const boxColor = type === "title" ? "black@0.55" : "black@0.45";
  const fontFile = defaultFontFile();
  const options = [
    ...(fontFile ? [`fontfile='${fontFile}'`] : []),
    `text='${ffmpegText(item.text)}'`,
    `fontsize=${fontSize}`,
    "fontcolor=white",
    "box=1",
    `boxcolor=${boxColor}`,
    "boxborderw=28",
    `x=${x}`,
    `y=${y}`,
    `enable='between(t,${item.start},${item.end})'`
  ];
  return `drawtext=${options.join(":")}`;
}

function videoTrack(timeline: Timeline): Track {
  const track = timeline.timeline?.tracks.find((candidate) => candidate.type === "video");
  if (!track) throw new Error("timeline.tracks must include a video track");
  return track;
}

function textTracks(timeline: Timeline): Track[] {
  return timeline.timeline?.tracks.filter((track) => track.type === "title" || track.type === "caption") ?? [];
}

function outputPath(projectRoot: string, timeline: Timeline, override?: string): string {
  return projectPath(projectRoot, override ?? timeline.render.output ?? "renders/output.mp4");
}

function primarySourcePath(projectRoot: string, timeline: Timeline): string {
  const items = videoTrack(timeline).items as VideoItem[];
  const firstItem = items[0];
  const source = firstItem?.source ?? timeline.source?.path;
  if (!source) throw new Error("source.path or first video item source is required");
  return projectPath(projectRoot, source);
}

async function probeHasAudio(mediaPath: string): Promise<boolean> {
  return await new Promise((resolve) => {
    const child = spawn("ffprobe", [
      "-hide_banner",
      "-select_streams", "a",
      "-show_entries", "stream=codec_type",
      "-of", "csv=p=0",
      mediaPath
    ], { stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0 && output.trim().includes("audio")));
  });
}

function buildFfmpegArgs(projectRoot: string, timeline: Timeline, output: string, hasAudio: boolean): string[] {
  const items = videoTrack(timeline).items as VideoItem[];
  if (items.length === 0) throw new Error("video track must include at least one item");
  const firstItem = items[0];
  const source = firstItem?.source ?? timeline.source?.path;
  if (!source) throw new Error("source.path or first video item source is required");
  const { width, height } = parseResolution(timeline.render.variant.resolution);
  const filters: string[] = [];
  const concatInputs: string[] = [];
  for (const [index, item] of items.entries()) {
    const sourceStart = item.sourceStart ?? 0;
    const duration = item.end - item.start;
    filters.push(`[0:v]trim=start=${sourceStart}:duration=${duration},setpts=PTS-STARTPTS[v${index}]`);
    if (hasAudio) {
      filters.push(`[0:a]atrim=start=${sourceStart}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`);
      concatInputs.push(`[v${index}][a${index}]`);
    } else {
      concatInputs.push(`[v${index}]`);
    }
  }
  filters.push(`${concatInputs.join("")}concat=n=${items.length}:v=1:a=${hasAudio ? 1 : 0}[cv]${hasAudio ? "[ca]" : ""}`);
  filters.push(`[cv]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[base]`);
  let current = "base";
  let overlay = 0;
  for (const track of textTracks(timeline)) {
    for (const item of track.items as TextItem[]) {
      const next = `txt${overlay}`;
      filters.push(`[${current}]${drawText(item, track.type)}[${next}]`);
      current = next;
      overlay += 1;
    }
  }
  const args = ["-y", "-i", projectPath(projectRoot, source), "-filter_complex", filters.join(";"), "-map", `[${current}]`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
  if (hasAudio) args.push("-map", "[ca]", "-c:a", "aac");
  args.push(output);
  return args;
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "inherit" });
    child.on("error", (error) => reject(new Error(`Failed to start ffmpeg. Is ffmpeg installed? ${error.message}`)));
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code ?? "unknown"}`)));
  });
}

async function readPackageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8")) as { version?: string };
  return packageJson.version ?? "0.0.0";
}

function compareVersions(a: string, b: string): number {
  const left = a.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

async function npmViewVersion(packageName: string): Promise<string | undefined> {
  return await new Promise((resolve) => {
    const executable = spawnCommand("npm", ["view", packageName, "version", "--silent"]);
    const child = spawn(executable.command, executable.args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", () => resolve(undefined));
    child.on("exit", (code) => resolve(code === 0 ? output.trim().split(/\s+/)[0] : undefined));
  });
}

async function checkForUpdates(): Promise<void> {
  const current = await readPackageVersion();
  const latest = await npmViewVersion("henshusha");
  if (!latest) {
    console.warn("Could not check npm for henshusha updates.");
    return;
  }
  if (compareVersions(latest, current) > 0) {
    console.log(`Update available: henshusha ${current} -> ${latest}`);
    console.log("Update command: npm install -g henshusha@latest, or rerun with npx henshusha@latest");
    console.log("Workspace update path: npx henshusha@latest doctor --updates now; full workspace upgrade command is planned.");
    return;
  }
  console.log(`henshusha is up to date (${current}).`);
}

async function runCapture(command: string, args: string[]): Promise<{ ok: boolean; stdout: string }> {
  return await new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.on("error", () => resolve({ ok: false, stdout: "" }));
    child.on("exit", (code) => resolve({ ok: code === 0, stdout }));
  });
}

function ffmpegInstallHints(): string[] {
  if (process.platform === "win32") {
    return [
      "Windows install options:",
      "  winget install Gyan.FFmpeg",
      "  https://www.gyan.dev/ffmpeg/builds/",
      "Ensure ffmpeg and ffprobe are on PATH, then rerun: henshusha doctor"
    ];
  }
  return [
    "Install options:",
    "  macOS: brew install ffmpeg",
    "  Linux: use your distro package manager or https://ffmpeg.org/download.html",
    "Ensure ffmpeg and ffprobe are on PATH, then rerun: henshusha doctor"
  ];
}

async function doctor(argv: string[] = []): Promise<void> {
  console.log("Henshusha doctor");
  const ffmpegVersion = await runCapture("ffmpeg", ["-version"]);
  const ffprobeVersion = await runCapture("ffprobe", ["-version"]);
  if (ffmpegVersion.ok) {
    const firstLine = ffmpegVersion.stdout.split(/\r?\n/)[0] ?? "ffmpeg";
    console.log(`ffmpeg: ok (${firstLine})`);
  } else {
    console.warn("ffmpeg: missing (required for render)");
    for (const line of ffmpegInstallHints()) console.warn(line);
  }
  if (ffprobeVersion.ok) {
    const firstLine = ffprobeVersion.stdout.split(/\r?\n/)[0] ?? "ffprobe";
    console.log(`ffprobe: ok (${firstLine})`);
  } else {
    console.warn("ffprobe: missing (required for render metadata checks)");
  }
  if (hasFlag(argv, "--updates")) await checkForUpdates();
}

async function validateProject(argv: string[]): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), firstPositional(argv, "projects/sample-video"));
  const timelinePath = await findTimelinePath(projectRoot, parseOption(argv, "--timeline"));
  const result = validateTimelineObject(JSON.parse(await readFile(timelinePath, "utf8")) as unknown);
  if (!result.ok) throw new Error(`Invalid Henshusha timeline:\n${result.errors.join("\n")}`);
  console.log(`Valid timeline: ${path.relative(process.cwd(), timelinePath)}`);
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
}

interface RenderPlan {
  schemaVersion: 1;
  kind: "henshusha.render-plan";
  createdAt: string;
  projectRoot: string;
  timelinePath: string;
  outputPath: string;
  dryRun: true;
  render: Timeline["render"];
  inputs: Array<{ path: string; role: "video" }>;
  overlays: Array<{ trackId: string; type: "title" | "caption"; start: number; end: number; text: string; preset?: string; accent?: string; label?: string; speaker?: string }>;
  ffmpeg: {
    executable: "ffmpeg";
    args: string[];
    command: string;
    hasAudio: boolean;
  };
}

interface RemotionTimelineProps {
  schemaVersion: 1;
  kind: "henshusha.remotion-props";
  createdAt: string;
  projectRoot: string;
  timelinePath: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  timeline: Timeline;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=+@%-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function uniqueVideoInputs(projectRoot: string, timeline: Timeline): Array<{ path: string; role: "video" }> {
  const inputs = new Set<string>();
  for (const item of videoTrack(timeline).items as VideoItem[]) {
    const source = item.source ?? timeline.source?.path;
    if (source) inputs.add(projectPath(projectRoot, source));
  }
  if (inputs.size === 0 && timeline.source?.path) inputs.add(projectPath(projectRoot, timeline.source.path));
  return [...inputs].map((inputPath) => ({ path: inputPath, role: "video" as const }));
}

function timelineOverlays(timeline: Timeline): RenderPlan["overlays"] {
  return textTracks(timeline).flatMap((track) => (track.items as TextItem[]).map((item) => ({
    trackId: track.id,
    type: track.type as "title" | "caption",
    start: item.start,
    end: item.end,
    text: item.text,
    ...(item.preset ? { preset: item.preset } : {}),
    ...(item.accent ? { accent: item.accent } : {}),
    ...(item.label ? { label: item.label } : {}),
    ...(item.speaker ? { speaker: item.speaker } : {})
  })));
}

function buildRenderPlan(projectRoot: string, timelinePath: string, timeline: Timeline, output: string, ffmpegArgs: string[], hasAudio: boolean): RenderPlan {
  return {
    schemaVersion: 1,
    kind: "henshusha.render-plan",
    createdAt: new Date().toISOString(),
    projectRoot,
    timelinePath,
    outputPath: output,
    dryRun: true,
    render: timeline.render,
    inputs: uniqueVideoInputs(projectRoot, timeline),
    overlays: timelineOverlays(timeline),
    ffmpeg: {
      executable: "ffmpeg",
      args: ffmpegArgs,
      command: ["ffmpeg", ...ffmpegArgs].map(shellQuote).join(" "),
      hasAudio
    }
  };
}

async function writeRenderPlan(projectRoot: string, timelinePath: string, timeline: Timeline, output: string, planOutput?: string): Promise<string> {
  const hasAudio = await probeHasAudio(primarySourcePath(projectRoot, timeline));
  const ffmpegArgs = buildFfmpegArgs(projectRoot, timeline, output, hasAudio);
  const planPath = projectPath(projectRoot, planOutput ?? "jobs/render-plan.json");
  await mkdir(path.dirname(planPath), { recursive: true });
  await writeFile(planPath, `${JSON.stringify(buildRenderPlan(projectRoot, timelinePath, timeline, output, ffmpegArgs, hasAudio), null, 2)}\n`, "utf8");
  return planPath;
}

function timelineDurationSeconds(timeline: Timeline): number {
  if (isNumber(timeline.timeline?.duration) && timeline.timeline.duration > 0) return timeline.timeline.duration;
  const maxEnd = timeline.timeline?.tracks.flatMap((track) => track.items).reduce((max, item) => Math.max(max, item.end), 0) ?? 0;
  if (maxEnd <= 0) throw new Error("timeline duration could not be inferred");
  return maxEnd;
}

function buildRemotionProps(projectRoot: string, timelinePath: string, timeline: Timeline, fps: number): RemotionTimelineProps {
  const { width, height } = parseResolution(timeline.render.variant.resolution);
  return {
    schemaVersion: 1,
    kind: "henshusha.remotion-props",
    createdAt: new Date().toISOString(),
    projectRoot,
    timelinePath,
    fps,
    width,
    height,
    durationInFrames: Math.ceil(timelineDurationSeconds(timeline) * fps),
    timeline
  };
}

async function writeRemotionProps(projectRoot: string, timelinePath: string, timeline: Timeline, output?: string, fps = 30): Promise<string> {
  const propsPath = projectPath(projectRoot, output ?? "remotion/timeline-props.json");
  await mkdir(path.dirname(propsPath), { recursive: true });
  await writeFile(propsPath, `${JSON.stringify(buildRemotionProps(projectRoot, timelinePath, timeline, fps), null, 2)}\n`, "utf8");
  return propsPath;
}

async function renderProject(argv: string[]): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), firstPositional(argv, "projects/sample-video"));
  const timelinePath = await findTimelinePath(projectRoot, parseOption(argv, "--timeline"));
  const timeline = await readTimeline(timelinePath);
  const validation = validateTimelineObject(timeline);
  for (const warning of validation.warnings) console.warn(`Warning: ${warning}`);
  const output = outputPath(projectRoot, timeline, parseOption(argv, "--output"));
  const hasAudio = await probeHasAudio(primarySourcePath(projectRoot, timeline));
  if (!hasAudio) console.warn("Warning: source has no audio stream; rendering video-only output");
  if (hasFlag(argv, "--dry-run")) {
    const planPath = await writeRenderPlan(projectRoot, timelinePath, timeline, output, parseOption(argv, "--plan-output"));
    console.log(`Wrote render plan: ${path.relative(process.cwd(), planPath)}`);
    return;
  }
  await mkdir(path.dirname(output), { recursive: true });
  console.log(`Rendering ${path.relative(process.cwd(), timelinePath)} -> ${path.relative(process.cwd(), output)}`);
  await runFfmpeg(buildFfmpegArgs(projectRoot, timeline, output, hasAudio));
  console.log(`Rendered: ${output}`);
}

async function remotionPropsProject(argv: string[]): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), firstPositional(argv, "projects/sample-video"));
  const timelinePath = await findTimelinePath(projectRoot, parseOption(argv, "--timeline"));
  const timeline = await readTimeline(timelinePath);
  const fpsValue = parseOption(argv, "--fps");
  const fps = fpsValue ? Number(fpsValue) : 30;
  if (!Number.isFinite(fps) || fps <= 0) throw new Error("--fps must be a positive number");
  const propsPath = await writeRemotionProps(projectRoot, timelinePath, timeline, parseOption(argv, "--output"), fps);
  console.log(`Wrote Remotion props: ${path.relative(process.cwd(), propsPath)}`);
}

async function newProject(argv: string[]): Promise<void> {
  const name = argv[0];
  if (!name || name.startsWith("-")) throw new Error("Usage: henshusha new-project <project-name>");
  const targetDir = path.resolve(process.cwd(), "projects", name);
  if (await exists(targetDir) && (await readdir(targetDir)).length > 0) throw new Error(`Target project directory is not empty: ${targetDir}`);
  const sampleSource = await findFirstExisting([
    path.join(packageRoot, "templates", "basic", "projects", "sample-video"),
    path.resolve(process.cwd(), "packages/henshusha/templates/basic/projects/sample-video")
  ]);
  await copyDirectoryContents(sampleSource, targetDir);
  console.log(`Created Henshusha video project at ${targetDir}`);
}

function parseScaffoldArgs(argv: string[]): { workspaceName: string; targetDir: string; install: boolean; git: boolean } {
  const install = !argv.includes("--no-install");
  const git = !argv.includes("--no-git");
  const positional = argv.filter((value) => !["--no-install", "--install", "--no-git", "--git"].includes(value));
  const workspaceName = positional[0] ?? "henshusha-workspace";
  if (workspaceName.startsWith("-")) throw new Error("Usage: henshusha [workspace-name] [--no-install] [--no-git]");
  if (positional.length > 1) throw new Error("Usage: henshusha [workspace-name] [--no-install] [--no-git]");
  return { workspaceName, targetDir: path.resolve(process.cwd(), workspaceName), install, git };
}

export async function createHenshushaWorkspace(argv = process.argv.slice(2)): Promise<void> {
  const { workspaceName, targetDir, install, git } = parseScaffoldArgs(argv);
  if (await exists(targetDir) && (await readdir(targetDir)).length > 0) throw new Error(`Target directory is not empty: ${targetDir}`);
  const templateSource = await findFirstExisting([path.join(packageRoot, "templates", "basic"), path.resolve(process.cwd(), "packages/henshusha/templates/basic")]);
  const skillsSource = await findFirstExisting([path.join(packageRoot, "skills"), path.resolve(process.cwd(), "packages/agent-kit/skills")]);
  await copyDirectoryContents(templateSource, targetDir);
  await copySkills(skillsSource, targetDir);
  await updateWorkspacePackageJson(targetDir, workspaceName);
  const packageManager = detectPackageManager();
  let installResult: { ok: boolean; command: string } | undefined;
  if (install) installResult = await installWorkspaceDependencies(targetDir, packageManager);
  let gitResult: { ok: boolean; command: string } | undefined;
  if (git) gitResult = await initializeGitRepository(targetDir);
  console.log(`Created Henshusha workspace at ${targetDir}`);
  if (!install) console.log("Skipped dependency install. Run npm install, pnpm install, or bun install inside the workspace.");
  else if (!installResult?.ok) console.log(`Workspace created, but dependency install failed. Run ${installResult?.command ?? "npm install"} inside the workspace.`);
  if (!git) console.log("Skipped git init. Run git init inside the workspace when you are ready.");
  else if (!gitResult?.ok) console.log("Workspace created, but git init failed. Run git init inside the workspace when you are ready.");
  console.log("Next:");
  console.log(`  cd ${workspaceName}`);
  console.log(`  ${packageManager === "yarn" ? "yarn remotion:props" : `${packageManager} run remotion:props`}`);
  console.log(`  ${packageManager === "yarn" ? "yarn remotion:preview" : `${packageManager} run remotion:preview`}`);
  console.log("  claude  # or codex / pi");
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;
  if (command === "validate") return validateProject(rest);
  if (command === "render") return renderProject(rest);
  if (command === "remotion-props") return remotionPropsProject(rest);
  if (command === "new-project") return newProject(rest);
  if (command === "doctor") return doctor(rest);
  if (command === "help" || command === "--help" || command === "-h") {
    console.log("Usage: henshusha [workspace-name] [--no-install] [--no-git] | validate [project-dir] | render [project-dir] [--dry-run] [--plan-output <path>] | remotion-props [project-dir] [--output <path>] [--fps <number>] | new-project <name> | doctor [--updates]");
    return;
  }
  return createHenshushaWorkspace(argv);
}

function resolveExistingPath(target: string | undefined): string | undefined {
  if (!target) return undefined;
  try {
    return realpathSync(target);
  } catch {
    return undefined;
  }
}

const invokedFile = resolveExistingPath(process.argv[1]);
const resolvedCurrentFile = resolveExistingPath(currentFile);

if (invokedFile && resolvedCurrentFile && invokedFile === resolvedCurrentFile) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
