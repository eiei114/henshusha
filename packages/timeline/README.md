# @henshusha/timeline

Timeline JSON types, validation, and helpers for Henshusha.

## Purpose

`projects/<name>/timelines/*.timeline.json` is the editing source of truth. This package defines the `0.1` schema (video, title, and caption tracks), validates timelines for manual cut + overlay workflows, and exposes resolution parsing utilities.

## Public API

- Types: `HenshushaTimeline`, `TimelineTrack`, `TimelineAspect`, and related item types
- `validateTimeline`, `assertValidTimeline`, `formatValidationReport`
- `parseResolution`

Optional `transcript` blocks are typed for future ASR adapters; caption items remain the render source of truth for the MVP.

## Boundaries

- Schema and validation only — no FFmpeg or Remotion rendering.
- Whisper/ASR is not required for a valid manual timeline.
- Aspect ratio (`16:9`, `9:16`, `1:1`) is a per-timeline render choice, not a workspace constant.
- Private workspace package; the published `henshusha` CLI depends on a built copy under `dist/`.

## Pipeline role

```txt
edit plan / agent edits  →  Timeline JSON  →  @henshusha/timeline  →  render planners
```

## Contributor pointers

- Architecture (source of truth, deferred ASR): [`docs/architecture.md`](../../docs/architecture.md)
- Schema verification script: `pnpm test:timeline-schema`
- Build this package before `henshusha` typecheck: `pnpm --filter @henshusha/timeline build`
