# Henshusha

Henshusha is an agent-native video editing workspace for Claude Code, Codex, and Pi.

It is not a traditional video editor. The goal is to scaffold a local workspace where AI coding agents can analyze source media, generate transcripts, edit a canonical Timeline JSON file, and render videos through Remotion and FFmpeg.

## Target experience

```bash
npx create-henshusha my-video-project
cd my-video-project
claude # or codex / pi
```

Then ask an agent:

> Analyze `sources/raw/test.mp4`, draft captions and a timeline, then render a 9:16 short.

## MVP Pipeline

```txt
source video/audio
  -> audio extraction
  -> ASR provider
  -> normalized transcript
  -> Timeline JSON
  -> agent edits captions/cuts/render variant
  -> Remotion + FFmpeg render
  -> mp4 output
```

## Packages

- `create-henshusha` — `npx` workspace starter.
- `@henshusha/core` — config, job model, and pipeline primitives.
- `@henshusha/timeline` — Timeline JSON schema and helpers.
- `@henshusha/asr` — pluggable speech-to-text provider interface.
- `@henshusha/ffmpeg` — FFmpeg/ffprobe wrapper.
- `@henshusha/remotion` — Remotion render integration.
- `@henshusha/components` — reusable caption/layout/motion components.
- `@henshusha/templates` — starter video templates.
- `@henshusha/agent-kit` — Claude Code / Codex / Pi skills.
- `@henshusha/cli` — project-local command surface used by skills.

## Status

Planning / bootstrap. First milestone: render one captioned MP4 from one source file through the MVP Pipeline.
