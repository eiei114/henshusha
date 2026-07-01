# Contributing

## Setup

```bash
git clone https://github.com/eiei114/henshusha.git
cd henshusha
pnpm install
pnpm dev
```

## Principles

- Keep the repository directly buildable without Obsidian or Monofold.
- Treat Timeline JSON as the source of truth for edits.
- Keep Whisper/ASR optional and deferred for the MVP; manual timelines must work without transcription.
- Keep agent skills as first-class artifacts.
- Keep generated video workspaces separate from contributor setup.

## Before submitting changes

```bash
pnpm typecheck
```

Add or update docs when changing architecture, package boundaries, or workflow names.

## Bun

Bun users can contribute with:

```bash
bun install
bun run dev
```

Do not add package scripts that only work under pnpm unless there is a Bun-compatible path. Do not introduce Bun-only runtime APIs in published packages unless there is a Node-compatible fallback.

## Release notes

For `henshusha`, bump `packages/henshusha/package.json` before merging release changes. CI publishes only when that version is new on npm, then creates tag `v<version>`. Publishing uses npm Trusted Publishing/OIDC; do not add `NPM_TOKEN` secrets.
