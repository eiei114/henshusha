# @henshusha/remotion

Remotion integration layer for Henshusha.

## Purpose

Will connect validated Timeline JSON to Remotion compositions for richer preview and render than the FFmpeg overlay path alone.

## Public API

Stub only today: `packageName` export. Generated workspaces ship a Remotion starter under `projects/<name>/remotion/` via the [`henshusha`](../henshusha) scaffolder template (`remotion:preview`, `remotion:render` scripts).

## Boundaries

- Remotion bridge code only — shared caption/layout primitives belong in [`@henshusha/components`](../components); starter compositions belong in [`@henshusha/templates`](../templates).
- The MVP manual renderer does not require Remotion; FFmpeg cut + overlay remains the first path.
- Private workspace package; not published to npm.

## Pipeline role

```txt
Timeline JSON  →  remotion props  →  @henshusha/remotion  →  preview / MP4
```

## Contributor pointers

- Text overlay presets in generated workspaces: see [`packages/henshusha/README.md`](../henshusha/README.md) (Remotion starter section)
- Roadmap: Phase 1 “One Remotion template” in [`docs/roadmap.md`](../../docs/roadmap.md)
