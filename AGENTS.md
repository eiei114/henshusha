# AGENTS.md

## Project

Henshusha is an agent-native video editing workspace starter for Claude Code, Codex, and Pi.

## Core rules

- A generated Henshusha workspace may contain many Video Projects under `projects/<project-name>/`.
- Video Project paths in Timeline JSON are relative to that Video Project folder unless absolute.

- Treat `projects/<project-name>/timelines/*.timeline.json` as the editing source of truth.
- Keep raw media in each video project's `sources/raw/`; do not rewrite raw source files in-place.
- ASR providers must be replaceable. Do not hard-code OpenAI Whisper as the only path.
- Render aspect ratio is a job-level choice: 16:9, 9:16, and 1:1 should remain selectable per timeline/job.
- Agent skills are first-class artifacts, not afterthought prompts.

## Package map

- `packages/core` — config and pipeline primitives.
- `packages/timeline` — Timeline JSON types/schema/helpers.
- `packages/asr` — pluggable speech-to-text provider interface.
- `packages/ffmpeg` — FFmpeg/ffprobe wrapper.
- `packages/remotion` — Remotion integration.
- `packages/components` — caption/layout/motion components.
- `packages/templates` — starter video templates.
- `packages/agent-kit` — Claude Code / Codex / Pi skills.
- `packages/cli` — project-local command surface used by skills.
- `packages/henshusha` — short workspace starter for `bunx henshusha` / `npx henshusha`.

## Contributor workflow

- Henshusha must be directly developable from this repository with `pnpm install` and `pnpm dev`.
- Do not make Obsidian, Monofold, or `henshusha --dev` mandatory for contributors.
- `henshusha` is the user-facing workspace starter; repo-local `pnpm dev:*` scripts are the contributor path.
- Use `pnpm dev:fixture` for dogfooding generated workspace shape before the real scaffolder exists.

## Bun-compatible contributor scripts

- Bun is a first-class contributor path: `bun install`, `bun run dev`, `bun run dev:fixture`.
- Keep root scripts package-manager neutral when practical.
- Keep pnpm support for npm publishing and ecosystem compatibility.
- Do not introduce Bun-only runtime APIs in published packages without a Node-compatible fallback.
