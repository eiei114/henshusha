# Henshusha

[![npm version](https://img.shields.io/npm/v/henshusha?logo=npm)](https://www.npmjs.com/package/henshusha)
[![npm downloads](https://img.shields.io/npm/dm/henshusha?logo=npm&label=downloads%2Fmonth)](https://www.npmjs.com/package/henshusha)
[![publish](https://img.shields.io/github/actions/workflow/status/eiei114/henshusha/publish-henshusha.yml?branch=main&label=publish)](https://github.com/eiei114/henshusha/actions/workflows/publish-henshusha.yml)
[![license](https://img.shields.io/npm/l/henshusha)](./LICENSE)

Henshusha is an agent-native video editing workspace for Claude Code, Codex, and Pi.

It is not a traditional video editor. The goal is to scaffold a local workspace where AI coding agents can analyze source media, generate transcripts, edit a canonical Timeline JSON file, and render videos through Remotion and FFmpeg.

## Target experience

```bash
bunx henshusha@latest my-studio
# or: npx henshusha@latest my-studio / pnpm dlx henshusha@latest my-studio
cd my-studio
claude # or codex / pi
```

Recommended for Bun users: keep `@latest` on the first scaffold command so Bun does not reuse an older cached starter.

```bash
bunx henshusha@latest demo
```

If Bun still reuses an old cache:

```bash
bun pm cache rm
bunx henshusha@latest my-studio
```

The starter installs Remotion dependencies, initializes a local Git repository, and pins a workspace-local `henshusha` CLI by default. Use `--no-install` or `--no-git` when you need a lighter scaffold.
Run `npm run doctor:updates` inside a generated workspace to check whether a newer package is available.

Then ask an agent:

> Work on `projects/sample-video`: turn the edit plan into manual cuts, add a midway title and caption overlays, then render a 9:16 short.

## Workspace model

`henshusha` creates a workspace root, not a single-video folder. The workspace can contain multiple video projects under `projects/`. Each video project owns its sources, scripts, transcripts, timelines, renders, and jobs.

```txt
my-studio/
  .git/
  .gitattributes
  .gitignore
  henshusha.config.json
  projects/
    sample-video/
      sources/raw/
      scripts/
      transcripts/
      timelines/
      renders/
      jobs/
  .claude/skills/
  .codex/skills/
  .pi/skills/
```

The first starter is biased toward manual timeline editing: human edit plan, explicit cuts, midway titles, large Japanese captions, 9:16 output, and Remotion text template components for richer captions/titles.

## MVP Pipeline

```txt
source video
  -> manual edit plan
  -> Timeline JSON
  -> agent edits captions/cuts/render variant
  -> FFmpeg cut + overlay render
  -> optional Remotion preview/render with text templates
  -> mp4 output
```

## Packages

- `henshusha` — short workspace starter used as `bunx henshusha@latest` / `npx henshusha@latest`.
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

## CI and automation

- **CI** runs on every PR and on pushes to `main` with a fast Ubuntu path for `pnpm typecheck` + `pnpm test:henshusha`.
- **Cross-platform smoke** runs the CLI entry regression on Ubuntu, macOS, and Windows so starter behavior stays portable.
- **Publish** stays release-focused: build, local smoke, npm publish, then real `npx` / `bunx` verification after registry propagation.
- **Dependabot** keeps npm dependencies and GitHub Actions up to date in weekly grouped PRs.
- **Dependency Review** runs on PRs to flag risky dependency changes before merge.

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
