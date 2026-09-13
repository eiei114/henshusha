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
pnpm test:dev-script-docs
pnpm test:version-policy-docs
pnpm test:examples
pnpm test:dependabot-config
pnpm test:timeline-schema
pnpm test:henshusha
```

Add or update docs when changing architecture, package boundaries, or workflow names.

## Bun

Bun users can contribute with:

```bash
bun install
bun run dev
```

Do not add package scripts that only work under pnpm unless there is a Bun-compatible path. Do not introduce Bun-only runtime APIs in published packages unless there is a Node-compatible fallback.

## Version policy

The root `package.json` stays at **`0.0.1`** because this repository is a private monorepo workspace. It is not published to npm and its version is not user-facing.

The published npm package version lives in **`packages/henshusha/package.json`**. That file is the single version source for `henshusha` releases, npm tags, and the publish workflow in [`.github/workflows/publish-henshusha.yml`](../.github/workflows/publish-henshusha.yml).

Other workspace packages under `packages/*` may remain at `0.0.0` while they are stubs or build-only dependencies. Do not bump the root monorepo version when shipping a `henshusha` release.

## Release notes

For `henshusha`, bump `packages/henshusha/package.json` before merging release changes. CI publishes only when that version is new on npm, then creates tag `v<version>`. Publishing uses npm Trusted Publishing/OIDC with Node 24 plus `npm publish --provenance --access public`; do not add `NPM_TOKEN` secrets.
