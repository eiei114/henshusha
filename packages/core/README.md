# @henshusha/core

Workspace configuration types and defaults for the Henshusha monorepo.

## Purpose

Defines the shape of `henshusha.config.json` and the per–video-project folder layout (`sources/raw`, `scripts`, `transcripts`, `timelines`, `renders`). Other packages and the published `henshusha` CLI read these primitives when scaffolding or validating a workspace.

## Public API

- `HenshushaConfig`, `HenshushaProjectLayout`, `HenshushaFeatureFlags`
- `defaultConfig`, `defaultProjectLayout`

## Boundaries

- Config and layout only — no timeline editing, rendering, or agent skill content.
- ASR and TTS are modeled as feature flags defaulting to `"deferred"`; enabling them does not implement providers here.
- Private workspace package (`"private": true`); not published to npm.

## Pipeline role

```txt
henshusha.config.json  →  @henshusha/core types  →  workspace / project paths
```

## Contributor pointers

- Package map: repo root [`AGENTS.md`](../../AGENTS.md)
- Architecture: [`docs/architecture.md`](../../docs/architecture.md)
- Develop: `pnpm install` then `pnpm check` from the repository root
