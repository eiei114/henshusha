# @henshusha/remotion

**Status:** interface/stub — not yet published.

Remotion integration layer for Henshusha.

## Purpose

Will connect validated Timeline JSON to Remotion compositions for richer preview and render than the FFmpeg overlay path alone.

## Public API

Stub only today: `packageName` export. Generated workspaces ship a Remotion starter under `projects/<name>/remotion/` via the [`henshusha`](../henshusha) scaffolder template (`remotion:preview`, `remotion:render` scripts).

## Boundaries

- Remotion bridge code only — shared caption/layout primitives belong in [`@henshusha/components`](../components); starter compositions belong in [`@henshusha/templates`](../templates).
- The MVP manual renderer does not require Remotion; FFmpeg cut + overlay remains the first path.
- Private workspace package; not published to npm.

## Current integration boundary

`@henshusha/remotion` is a future shared bridge, not part of the live generated-workspace render path. Generated workspaces currently use the scaffolder's Remotion starter directly:

```txt
Timeline JSON
  → henshusha remotion-props
  → projects/<name>/remotion/timeline-props.json
  → @remotion/cli (workspace dependency)
  → preview / MP4
```

The `timeline-props.json` file is regenerated from Timeline JSON and is not a second editing source of truth. Shared bridge code may move into this package later without changing that boundary.

## Verification

From the root of a generated workspace, run the live integration smoke command:

```bash
npm run remotion:render
```

This regenerates the props file and writes `projects/sample-video/renders/remotion-output.mp4`. To inspect the resulting container as a second check:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 projects/sample-video/renders/remotion-output.mp4
```

## Planned package role

```txt
Timeline JSON  →  remotion props  →  @henshusha/remotion (future shared bridge)
```

## Contributor pointers

- Full integration boundary: [`docs/remotion.md`](../../docs/remotion.md)
- Text overlay presets in generated workspaces: see [`packages/henshusha/README.md`](../henshusha/README.md) (Remotion starter section)
- Roadmap: Phase 1 “One Remotion template” in [`docs/roadmap.md`](../../docs/roadmap.md)
