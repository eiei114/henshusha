# AGENTS.md

## Project

Henshusha is an agent-native video editing workspace starter for Claude Code, Codex, and Pi.

## Core rules

- Treat `timelines/*.timeline.json` as the editing source of truth.
- Keep raw media in `sources/raw/`; do not rewrite raw source files in-place.
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
- `packages/create-henshusha` — npx workspace starter.
