# Henshusha

Henshusha is an agent-native video editing workspace for Claude Code, Codex, and Pi.

It is not a traditional video editor. The goal is to scaffold a local workspace where AI coding agents can analyze source media, generate transcripts, edit a canonical Timeline JSON file, and render videos through Remotion and FFmpeg.

## Target experience

```bash
bunx henshusha my-video-project
# or: npx henshusha my-video-project / pnpx henshusha my-video-project
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

- `henshusha` — short workspace starter used as `bunx henshusha` / `npx henshusha`.
- `@henshusha/core` — config, job model, and pipeline primitives.
- `@henshusha/timeline` — Timeline JSON schema and helpers.
- `@henshusha/asr` — pluggable speech-to-text provider interface.
- `@henshusha/ffmpeg` — FFmpeg/ffprobe wrapper.
- `@henshusha/remotion` — Remotion render integration.
- `@henshusha/components` — reusable caption/layout/motion components.
- `@henshusha/templates` — starter video templates.
- `@henshusha/agent-kit` — Claude Code / Codex / Pi skills.
- `@henshusha/cli` — project-local command surface used by skills.

## Development

Henshusha can be developed directly from this repository. Obsidian/Monofold context is helpful for planning, but not required for contributors.

```bash
git clone https://github.com/eiei114/henshusha.git
cd henshusha
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm dev` — run the default local development check.
- `pnpm dev:doctor` — install dependencies and run typechecks.
- `pnpm dev:fixture` — create a local dogfood workspace under `.fixtures/basic-workspace`.

See [`docs/development.md`](docs/development.md) and [`docs/contributing.md`](docs/contributing.md).

## Status

Planning / bootstrap. First milestone: render one captioned MP4 from one source file through the MVP Pipeline.

## Bun support

Bun is a first-class contributor path.

```bash
bun install
bun run dev
bun run dev:fixture
```

`pnpm` remains supported because many npm publishing and monorepo workflows still expect it, but Henshusha scripts should stay compatible with Bun.
