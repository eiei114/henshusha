#!/usr/bin/env node
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
interface TextItem { start: number; end: number; text: string; preset?: string }
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

async function updateWorkspaceName(projectRoot: string, workspaceName: string): Promise<void> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await exists(packageJsonPath))) return;
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { name?: string };
  packageJson.name = workspaceName;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
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
        } else if (!isString(item.text)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].text is required`);
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

function drawText(item: TextItem, type: TrackType): string {
  const preset = item.preset ?? (type === "title" ? "bold-center" : "bottom-caption");
  const fontSize = preset.includes("caption") || type === "caption" ? 54 : 76;
  const y = preset.includes("bottom") || type === "caption" ? "h-(text_h*3)" : "(h-text_h)/2";
  const boxColor = type === "title" ? "black@0.55" : "black@0.45";
  return [
    "drawtext=",
    `text='${ffmpegText(item.text)}'`,
    `fontsize=${fontSize}`,
    "fontcolor=white",
    "box=1",
    `boxcolor=${boxColor}`,
    "boxborderw=28",
    "x=(w-text_w)/2",
    `y=${y}`,
    `enable='between(t,${item.start},${item.end})'`
  ].join(":");
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

function buildFfmpegArgs(projectRoot: string, timeline: Timeline, output: string): string[] {
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
    filters.push(`[0:a]atrim=start=${sourceStart}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`);
    concatInputs.push(`[v${index}][a${index}]`);
  }
  filters.push(`${concatInputs.join("")}concat=n=${items.length}:v=1:a=1[cv][ca]`);
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
  return ["-y", "-i", projectPath(projectRoot, source), "-filter_complex", filters.join(";"), "-map", `[${current}]`, "-map", "[ca]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", output];
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "inherit" });
    child.on("error", (error) => reject(new Error(`Failed to start ffmpeg. Is ffmpeg installed? ${error.message}`)));
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code ?? "unknown"}`)));
  });
}

async function doctor(): Promise<void> {
  console.log("Henshusha doctor");
  await new Promise<void>((resolve) => {
    const child = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    child.on("error", () => {
      console.warn("ffmpeg: missing (required for render)");
      resolve();
    });
    child.on("exit", (code) => {
      console.log(code === 0 ? "ffmpeg: ok" : `ffmpeg: exited with code ${code ?? "unknown"}`);
      resolve();
    });
  });
}

async function validateProject(argv: string[]): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), argv[0] ?? "projects/sample-video");
  const timelinePath = await findTimelinePath(projectRoot, parseOption(argv, "--timeline"));
  const result = validateTimelineObject(JSON.parse(await readFile(timelinePath, "utf8")) as unknown);
  if (!result.ok) throw new Error(`Invalid Henshusha timeline:\n${result.errors.join("\n")}`);
  console.log(`Valid timeline: ${path.relative(process.cwd(), timelinePath)}`);
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
}

async function renderProject(argv: string[]): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), argv[0] ?? "projects/sample-video");
  const timelinePath = await findTimelinePath(projectRoot, parseOption(argv, "--timeline"));
  const timeline = await readTimeline(timelinePath);
  const validation = validateTimelineObject(timeline);
  for (const warning of validation.warnings) console.warn(`Warning: ${warning}`);
  const output = outputPath(projectRoot, timeline, parseOption(argv, "--output"));
  await mkdir(path.dirname(output), { recursive: true });
  console.log(`Rendering ${path.relative(process.cwd(), timelinePath)} -> ${path.relative(process.cwd(), output)}`);
  await runFfmpeg(buildFfmpegArgs(projectRoot, timeline, output));
  console.log(`Rendered: ${output}`);
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

function parseScaffoldArgs(argv: string[]): { workspaceName: string; targetDir: string } {
  const workspaceName = argv[0] ?? "henshusha-workspace";
  if (workspaceName.startsWith("-")) throw new Error("Usage: henshusha [workspace-name]");
  return { workspaceName, targetDir: path.resolve(process.cwd(), workspaceName) };
}

export async function createHenshushaWorkspace(argv = process.argv.slice(2)): Promise<void> {
  const { workspaceName, targetDir } = parseScaffoldArgs(argv);
  if (await exists(targetDir) && (await readdir(targetDir)).length > 0) throw new Error(`Target directory is not empty: ${targetDir}`);
  const templateSource = await findFirstExisting([path.join(packageRoot, "templates", "basic"), path.resolve(process.cwd(), "packages/henshusha/templates/basic")]);
  const skillsSource = await findFirstExisting([path.join(packageRoot, "skills"), path.resolve(process.cwd(), "packages/agent-kit/skills")]);
  await copyDirectoryContents(templateSource, targetDir);
  await copySkills(skillsSource, targetDir);
  await updateWorkspaceName(targetDir, workspaceName);
  console.log(`Created Henshusha workspace at ${targetDir}`);
  console.log("Next:");
  console.log(`  cd ${workspaceName}`);
  console.log("  claude  # or codex / pi");
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;
  if (command === "validate") return validateProject(rest);
  if (command === "render") return renderProject(rest);
  if (command === "new-project") return newProject(rest);
  if (command === "doctor") return doctor();
  if (command === "help" || command === "--help" || command === "-h") {
    console.log("Usage: henshusha [workspace-name] | validate [project-dir] | render [project-dir] | new-project <name> | doctor");
    return;
  }
  return createHenshushaWorkspace(argv);
}

if (process.argv[1] === currentFile) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
