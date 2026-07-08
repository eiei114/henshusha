# @henshusha/templates

Starter video templates for Henshusha workspaces.

## Purpose

Will package opinionated Remotion compositions and default art direction that map common timeline patterns (digest, talking head, captions-only) into ready-to-render projects.

## Public API

Stub only today: `packageName` export. New workspaces currently receive the `basic` template from [`packages/henshusha/templates`](../henshusha/templates) via the published CLI.

## Boundaries

- Template assets and composition entrypoints — not workspace scaffolding, skills, or the timeline schema.
- Templates should stay provider-neutral; narration/ASR adapters remain deferred per architecture docs.
- Private workspace package; not published to npm.

## Pipeline role

```txt
@henshusha/templates  →  workspace project / remotion/  →  render variants (16:9, 9:16, 1:1)
```

## Contributor pointers

- Render variants: [`docs/architecture.md`](../../docs/architecture.md)
- Roadmap: Phase 1 “One Remotion template” in [`docs/roadmap.md`](../../docs/roadmap.md)
- Fixture dogfooding: `pnpm dev:fixture` from repo root
