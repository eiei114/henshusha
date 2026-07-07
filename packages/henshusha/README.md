# henshusha

<p align="center">
  <img src="https://raw.githubusercontent.com/eiei114/henshusha/main/packages/henshusha/assets/henshusha-icon.png" alt="Henshusha icon" width="180" />
</p>

[![npm version](https://img.shields.io/npm/v/henshusha?logo=npm)](https://www.npmjs.com/package/henshusha)
[![npm downloads](https://img.shields.io/npm/dm/henshusha?logo=npm&label=downloads%2Fmonth)](https://www.npmjs.com/package/henshusha)
[![publish](https://img.shields.io/github/actions/workflow/status/eiei114/henshusha/publish-henshusha.yml?branch=main&label=publish)](https://github.com/eiei114/henshusha/actions/workflows/publish-henshusha.yml)
[![license](https://img.shields.io/npm/l/henshusha)](https://github.com/eiei114/henshusha/blob/main/LICENSE)

Create and operate a Henshusha agent-native video editing workspace.

```bash
npx henshusha@latest my-studio
# or
bunx henshusha@latest my-studio
```

Recommended for Bun users on the first run:

```bash
bunx henshusha@latest demo
```

If Bun still reuses an old cached package:

```bash
bun pm cache rm
bunx henshusha@latest my-studio
```

Repository CI keeps this starter checked in three layers: fast PR checks on Ubuntu, cross-platform CLI smoke on Ubuntu/macOS/Windows, and publish-time `npx` / `bunx` verification after npm propagation.

Scaffolding installs workspace dependencies and runs `git init` by default so the first Remotion preview and GitHub handoff are ready quickly. Use `--no-install` or `--no-git` to opt out.

## Standalone vs embedded init

**Standalone** creates a new empty studio directory (default command):

```bash
npx henshusha@latest my-studio
# or with explicit agent skills:
npx henshusha@latest my-studio --agents claude,pi
npx henshusha@latest my-studio --all-agents
npx henshusha@latest my-studio --no-skills
```

**Embedded init** merges Henshusha into an existing Git repository without creating a nested `.git/`:

```bash
cd your-existing-repo
npx henshusha@latest init
npx henshusha@latest init --dir videos
```

Embedded init flags (practical reference):

| Flag | Purpose |
| --- | --- |
| `--dir <path>` | Place scaffold content under a nested folder (for example `videos/projects/sample-video`). |
| `--agents claude,codex,pi` | Install skills only for listed runtimes (comma-separated). |
| `--all-agents` | Install Claude Code, Codex, and Pi skills (non-TTY default). |
| `--no-skills` | Scaffold workspace files without copying agent skills. |
| `--force` | Overwrite conflicting Henshusha package scripts and skill files. |
| `--dry-run` | Print the init plan without writing files. |
| `--no-install` | Skip dependency install (useful in CI and tests). |

On an interactive terminal, `henshusha init` with no agent flag shows a Space-toggle checkbox for Claude Code / Codex / Pi. Reruns preselect agents from `.henshusha/manifest.json` when present. Unchecking a runtime does not delete previously installed skills.

Agent skills install at the Git repository root during embedded init (not under `--dir`), while project files land in the content directory you choose.

The generated workspace is not a single-video project. It is a studio root that can contain many video projects:

```txt
my-studio/
  .git/
  .gitattributes
  .gitignore
  henshusha.config.json
  projects/
    sample-video/
      sources/raw/
      scripts/edit-plan.md
      transcripts/
      timelines/main.timeline.json
      renders/
      jobs/
  .claude/skills/
  .codex/skills/
  .pi/skills/
```

After the workspace install finishes, the generated package already includes a local `henshusha` devDependency. That keeps workspace scripts off the network on later runs.

MVP commands inside the generated workspace:

```bash
npm run validate
npm run render:dry-run
npm run render
npm run remotion:props
npm run doctor:updates
npm run new-project -- next-video
```

`render --dry-run` writes `projects/<project>/jobs/render-plan.json` with resolved paths, overlay timings, and the FFmpeg command without requiring FFmpeg to run.

Generated workspaces also include a Remotion starter under `projects/sample-video/remotion/` plus these scripts:

```bash
npm run remotion:props
npm run remotion:preview
npm run remotion:render
```

The Remotion starter includes `text-templates.tsx` with reusable presets for richer text overlays: `headline-pop`, `bottom-caption`, `karaoke-caption`, `lower-third`, and `quote-card`. Set `preset`, plus optional `accent`, `label`, or `speaker`, on `title` / `caption` timeline items to switch the look without rewriting the composition.

The first renderer is a manual cut + overlay path: source video clips are concatenated, then title/caption text is overlaid with FFmpeg. The Remotion path is available for richer visual composition. Whisper/ASR and VOICEVOX/Zundamon narration are intentionally deferred.


Packaged skills include `henshusha-digest-story`, which guides agents through a quick digest workflow: story beats → edit plan → Timeline JSON → FFmpeg dry-run/render → Remotion props/preview.

`doctor --updates` checks npm for a newer `henshusha` package and prints the update command. A full workspace file upgrade command is planned; current generated workspaces keep user-edited files under normal Git control.
