import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AgentRuntime = "claude" | "codex" | "pi";
export type InstallMode = "standalone" | "embedded";

export interface ManifestSkillRecord {
  agent: AgentRuntime;
  skill: string;
  relativePath: string;
  hash: string;
}

export interface InstallManifest {
  schemaVersion: 1;
  henshushaVersion: string;
  mode: InstallMode;
  contentRoot: string;
  gitRoot?: string;
  selectedAgents: AgentRuntime[];
  skills: ManifestSkillRecord[];
}

export const MANIFEST_RELATIVE_PATH = ".henshusha/manifest.json";

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function manifestPath(skillsRoot: string): string {
  return path.join(skillsRoot, MANIFEST_RELATIVE_PATH);
}

export async function readInstallManifest(skillsRoot: string): Promise<InstallManifest | undefined> {
  const target = manifestPath(skillsRoot);
  if (!(await exists(target))) return undefined;
  const parsed = JSON.parse(await readFile(target, "utf8")) as InstallManifest;
  if (parsed.schemaVersion !== 1) return undefined;
  return parsed;
}

export async function writeInstallManifest(skillsRoot: string, manifest: InstallManifest): Promise<void> {
  const target = manifestPath(skillsRoot);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export async function hashSkillDirectory(skillDir: string): Promise<string | undefined> {
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!(await exists(skillFile))) return undefined;
  return hashFile(skillFile);
}

export interface SkillCollision {
  agent: AgentRuntime;
  skill: string;
  targetPath: string;
  existingHash: string;
  desiredHash: string;
}

export function formatSkillCollisions(collisions: SkillCollision[]): string {
  const lines = collisions.map(
    (collision) =>
      `  - ${collision.agent}/${collision.skill}: ${collision.targetPath} (existing ${collision.existingHash}, desired ${collision.desiredHash})`
  );
  return `Henshusha skill collision detected. Use --force to overwrite:\n${lines.join("\n")}`;
}
