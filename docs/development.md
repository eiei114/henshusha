# Development

Henshusha should be directly contributor-ready from this repository. Monofold and Obsidian are useful for long-term product context, but they are not required to work on the tool.

## Quick start

```bash
git clone https://github.com/eiei114/henshusha.git
cd henshusha
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` — run the default local development check.
- `pnpm dev:doctor` — install dependencies and run typechecks.
- `pnpm dev:fixture` — create `.fixtures/basic-workspace` for dogfooding generated workspace shape.
- `pnpm typecheck` — typecheck all packages.
- `pnpm build` — build all packages that have a build script.

## Product boundary

Do not add a `create-henshusha --dev` primary path. `create-henshusha` is for users creating a video workspace. Henshusha contributors should clone this repository and use the normal development scripts.

Generated workspaces may later support upgrades with a command like `henshusha upgrade`, but that is separate from contributor setup.

## Dogfood loop

```bash
pnpm dev:fixture
cd .fixtures/basic-workspace
# open with claude / codex / pi when local skill copying exists
```

Until `create-henshusha` exists, the fixture is a stable sandbox for checking the expected workspace layout.

## Bun support

Bun is a first-class contributor path:

```bash
bun install
bun run dev
bun run dev:fixture
```

The repository keeps scripts package-manager neutral where practical. `pnpm` remains supported for lockfile and npm-publishing workflows, but new contributor scripts should also work under `bun run`.
