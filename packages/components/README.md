# @henshusha/components

Reusable caption, layout, and motion components for Henshusha renders.

## Purpose

Will hold shared React/Remotion building blocks (caption styles, safe-area layouts, motion presets) consumed by [`@henshusha/templates`](../templates) and workspace Remotion projects.

## Public API

Stub only today: `packageName` export. The generated workspace template includes example text presets in `text-templates.tsx` under the [`henshusha`](../henshusha) scaffolder until components are extracted here.

## Boundaries

- Presentation components only — no timeline validation, FFmpeg calls, or CLI surface.
- Keep engine-specific speaker IDs and provider metadata out of canonical Timeline JSON (see [`docs/architecture.md`](../../docs/architecture.md)).
- Private workspace package; not published to npm.

## Pipeline role

```txt
Timeline text items  →  @henshusha/components  →  Remotion / preview UI
```

## Contributor pointers

- Package map: [`AGENTS.md`](../../AGENTS.md)
- Roadmap: Phase 3 preview surface items in [`docs/roadmap.md`](../../docs/roadmap.md)
