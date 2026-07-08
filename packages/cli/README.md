# @henshusha/cli

Project-local command surface used by Henshusha agent skills.

## Purpose

Will expose stable, workspace-scoped subcommands (validate timeline, dry-run render, doctor, new-project) that skills invoke instead of hard-coding shell one-liners. Today those commands ship from the published [`henshusha`](../henshusha) binary (`henshusha validate`, `henshusha render`, etc.).

## Public API

Stub only today: `packageName` export in `src/index.ts`.

## Boundaries

- Workspace/project CLI only — not the `npx henshusha` scaffolder (that stays in [`packages/henshusha`](../henshusha)).
- Skills should call these commands; the primary editing experience remains agent-driven (see [`docs/architecture.md`](../../docs/architecture.md)).
- Private workspace package; end users depend on the `henshusha` npm package inside generated workspaces.

## Pipeline role

```txt
agent skill  →  @henshusha/cli  →  timeline / render / doctor commands
```

## Contributor pointers

- Contributor workflow: [`AGENTS.md`](../../AGENTS.md) (`pnpm dev`, `pnpm dev:fixture`)
- Generated workspace scripts: [`packages/henshusha/templates/basic/package.json`](../henshusha/templates/basic/package.json)
- Tests for CLI behavior: `pnpm test:henshusha` from repo root
