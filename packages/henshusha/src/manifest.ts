import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AgentRuntime = "claude" | "codex" | "pi";
export type InstallMode = "standalone" | "embedded";

const AGENT_RUNTIMES: readonly AgentRuntime[] = ["claude", "codex", "pi"];

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

function invalidManifest(target: string, detail: string): Error {
  return new Error(
    `Cannot reuse Henshusha install manifest at ${target}: ${detail}. ` +
      "Restore a valid schema-v1 manifest or remove it before rerunning init."
  );
}

export async function readInstallManifest(skillsRoot: string): Promise<InstallManifest | undefined> {
  const target = manifestPath(skillsRoot);
  if (!(await exists(target))) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw invalidManifest(target, `invalid JSON (${reason})`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw invalidManifest(target, "expected a JSON object");
  }

  const fields = parsed as Record<string, unknown>;
  if (fields.schemaVersion !== 1) {
    throw invalidManifest(
      target,
      `unsupported schemaVersion ${JSON.stringify(fields.schemaVersion)} (this CLI supports schemaVersion 1)`
    );
  }
  if (!Array.isArray(fields.selectedAgents)) {
    throw invalidManifest(target, "selectedAgents must be an array containing only claude, codex, or pi");
  }
  const invalidAgentIndex = fields.selectedAgents.findIndex(
    (agent) => typeof agent !== "string" || !AGENT_RUNTIMES.includes(agent as AgentRuntime)
  );
  if (invalidAgentIndex !== -1) {
    throw invalidManifest(
      target,
      `selectedAgents[${invalidAgentIndex}] is invalid (${JSON.stringify(fields.selectedAgents[invalidAgentIndex])}); expected claude, codex, or pi`
    );
  }
  return parsed as InstallManifest;
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
