#!/usr/bin/env node
import { access, cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const packageRoot = path.resolve(currentDir, "..");

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function findFirstExisting(candidates: string[]): Promise<string> {
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Missing required scaffold source. Tried:\n${candidates.join("\n")}`);
}

async function copyDirectoryContents(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source);
  for (const entry of entries) {
    const sourcePath = path.join(source, entry);
    const destinationPath = path.join(destination, entry);
    const info = await stat(sourcePath);
    if (info.isDirectory()) {
      await copyDirectoryContents(sourcePath, destinationPath);
    } else {
      await cp(sourcePath, destinationPath, { force: false, errorOnExist: false });
    }
  }
}

async function copySkills(skillsSource: string, projectRoot: string): Promise<void> {
  const runtimes = [".claude/skills", ".codex/skills", ".pi/skills"];
  for (const runtime of runtimes) {
    await mkdir(path.join(projectRoot, runtime), { recursive: true });
    await copyDirectoryContents(skillsSource, path.join(projectRoot, runtime));
  }
}

async function updateWorkspaceName(projectRoot: string, projectName: string): Promise<void> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await exists(packageJsonPath))) {
    return;
  }
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { name?: string };
  packageJson.name = projectName;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function parseArgs(argv: string[]): { projectName: string; targetDir: string } {
  const [projectNameArg] = argv;
  const projectName = projectNameArg ?? "henshusha-video";
  if (projectName.startsWith("-")) {
    throw new Error("Usage: create-henshu [project-name]");
  }
  return {
    projectName,
    targetDir: path.resolve(process.cwd(), projectName)
  };
}

export async function createHenshushaProject(argv = process.argv.slice(2)): Promise<void> {
  const { projectName, targetDir } = parseArgs(argv);
  if (await exists(targetDir)) {
    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  }

  const templateSource = await findFirstExisting([
    path.join(packageRoot, "templates", "basic"),
    path.resolve(process.cwd(), "packages/create-henshu/templates/basic")
  ]);
  const skillsSource = await findFirstExisting([
    path.join(packageRoot, "skills"),
    path.resolve(process.cwd(), "packages/agent-kit/skills")
  ]);

  await copyDirectoryContents(templateSource, targetDir);
  await copySkills(skillsSource, targetDir);
  await updateWorkspaceName(targetDir, projectName);

  console.log(`Created Henshusha workspace at ${targetDir}`);
  console.log("Next:");
  console.log(`  cd ${projectName}`);
  console.log("  claude  # or codex / pi");
}

if (process.argv[1] === currentFile) {
  createHenshushaProject().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
