# @henshusha/ffmpeg

FFmpeg and ffprobe wrapper for the Henshusha render pipeline.

## Purpose

Will host typed helpers for media inspection, segment extraction, concat, and text overlay — the manual cut + overlay path described in [`docs/architecture.md`](../../docs/architecture.md).

## Public API

Stub only today: `packageName` export. The live MVP render planner and `henshusha render` command live in the published [`henshusha`](../henshusha) package until this library is split out.

## Boundaries

- FFmpeg orchestration only — no timeline schema (see [`@henshusha/timeline`](../timeline)) or Remotion composition logic.
- Requires a system `ffmpeg` / `ffprobe` install at render time; dry-run plans do not execute binaries.
- Private workspace package; not published to npm.

## Pipeline role

```txt
Timeline JSON  →  render plan  →  @henshusha/ffmpeg  →  MP4 output
```

## Contributor pointers

- Data flow: [`docs/architecture.md`](../../docs/architecture.md)
- Dogfood render verification: `pnpm dev:verify-render` (from repo root, with FFmpeg installed)
- Roadmap: Phase 1 “FFmpeg media inspection/extraction wrapper” in [`docs/roadmap.md`](../../docs/roadmap.md)
