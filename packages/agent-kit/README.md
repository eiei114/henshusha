# @henshusha/agent-kit

Agent skills for Claude Code, Codex, and Pi in Henshusha workspaces.

## Purpose

Source tree for Henshusha agent skills — markdown instructions and workflows that teach agents how to analyze source media, edit timelines, and run renders. Skills are first-class artifacts, not ad-hoc prompts (see [`AGENTS.md`](../../AGENTS.md)).

## Layout

```txt
skills/
  henshusha-analyze-source/
  henshusha-edit-timeline/
  henshusha-render/
  henshusha-digest-story/
```

The published [`henshusha`](../henshusha) CLI copies these into `.claude/skills`, `.codex/skills`, or `.pi/skills` at the Git repository root when scaffolding or running `henshusha init`.

## Public API

- TypeScript entry: `packageName` stub in `src/index.ts`
- Real surface: skill directories under `skills/` (consumed by the CLI, not imported as a library today)

## Boundaries

- Agent instructions and workflow docs only — no render implementation (see [`henshusha`](../henshusha) CLI and [`@henshusha/ffmpeg`](../ffmpeg)).
- Skills install at the workspace Git root; video project files live under `projects/<name>/`.
- Private workspace package; skills ship inside the npm `henshusha` package bundle.

## Contributor pointers

- CLI skill copy paths: [`packages/henshusha/src/index.ts`](../henshusha/src/index.ts) (`findFirstExisting` → `packages/agent-kit/skills`)
- Roadmap: Phase 0 “Agent skill draft files” in [`docs/roadmap.md`](../../docs/roadmap.md)
- When adding a skill, keep commands aligned with workspace `package.json` scripts (`validate`, `render`, `render:dry-run`, etc.)
