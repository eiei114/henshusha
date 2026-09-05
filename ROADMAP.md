# Roadmap

This is the canonical roadmap for **henshusha**, the agent-native video editing
workspace starter (`bunx henshusha@latest` / `npx henshusha@latest`).

It records **current release status**, the **short-term direction** for the next
few releases, **known technical debt**, and a backlog of **bounded maintenance
seeds** (each 30–90 minutes) that the weekly maintenance planner can promote into
small, reviewable issues.

> **Scope note.** Direction items below are proposals for the human maintainer,
> not committed promises. The maintainer owns release scope, publishing, and
> priorities. Seeds are explicitly bounded so any one of them can be picked up
> independently.

A historical phase view lives in [`docs/roadmap.md`](docs/roadmap.md); this root
file is the single source of truth for status and seeds.

**Last refreshed:** 2026-09-05 (DOT-1012)

---

## Current release status

| Item | State |
| --- | --- |
| npm package `henshusha` | **`0.5.1`** (`latest`, published 2026-07-20, tag `v0.5.1`) |
| Release boundary | Embedded `henshusha init` (interactive agent TUI, install manifest, `--force`, `--dry-run`) |
| Manual edit pipeline | **Live** — Timeline JSON → FFmpeg cut + overlay render, `validate` / `render` / `remotion-props` / `doctor:updates` |
| Timeline JSON schema | **Stabilized** (`@henshusha/timeline` validator, actionable JSON-path errors, gap/overlap warnings) |
| Agent skills | 3 shipped via embedded init: `analyze-source`, `edit-timeline`, `render` |
| ASR (speech-to-text) | **Deferred** — provider interface + `MockAsrProvider` only, no real adapter |
| Remotion render | **Partial** — CLI emits `timeline-props.json`; in-workspace Remotion render is the manual path, the `@henshusha/remotion` lib package is a stub |
| CI / automation | CI on PR + `main`, cross-platform smoke (Ubuntu/macOS/Windows), npm Trusted Publishing (OIDC), Dependabot, dependency review |
| Open issues / PRs | 1 open Dependabot PR (`@types/node` bump) at time of refresh |

### Shipped capability (0.5.x)

- `bunx henshusha@latest <name>` scaffolds a multi-project workspace with
  `projects/sample-video/`, workspace config, and per-agent skills.
- Project-local `henshusha` CLI: `validate`, `render` (FFmpeg cut + overlay),
  `remotion-props`, `doctor:updates`, and the embedded `init`.
- Timeline JSON (`version: "0.1"`) is the editing source of truth, validated
  with gap/overlap warnings and regression tests in `pnpm test:timeline-schema`.
- 10 packages are declared in the monorepo, but **only two have real
  implementations** today: `henshusha` (the starter/CLI) and `@henshusha/timeline`
  (the validator). See [Package maturity](#package-maturity).

### Package maturity

| Package | npm version | Implementation |
| --- | --- | --- |
| `henshusha` | `0.5.1` | Full — starter + project-local CLI |
| `@henshusha/timeline` | `0.0.0` | Real validator (build dependency of `henshusha`) |
| `@henshusha/core` | `0.0.0` | Types/config interfaces only |
| `@henshusha/asr` | `0.0.0` | Provider interface + `MockAsrProvider` |
| `@henshusha/ffmpeg` | `0.0.0` | Stub (`export const packageName`) |
| `@henshusha/remotion` | `0.0.0` | Stub |
| `@henshusha/components` | `0.0.0` | Stub |
| `@henshusha/templates` | `0.0.0` | Stub |
| `@henshusha/agent-kit` | `0.0.0` | Stub `src`; real `skills/` SKILL.md assets |
| `@henshusha/cli` | `0.0.0` | Stub |

---

## Short-term direction (next 2–3 releases)

These are candidate themes for the maintainer to sequence. Each should land as
small, independently-shippable changes.

### 0.5.x — Stabilize the manual pipeline & docs

- Keep embedded `init` robust across Bun/pnpm/npx and the three agent runtimes.
- Finish remaining doc/test seeds below (Remotion boundary, version policy,
  `doctor:updates` smoke).
- Make the roadmap self-maintaining via the seed backlog.

### 0.6 — Promote the first library package

- Decide the publish story for `@henshusha/timeline` (move off `0.0.0`, or keep
  workspace-internal) and document it.
- Improve render-variant coverage (16:9 / 1:1) and Remotion-props fidelity so the
  same timeline renders multiple aspects cleanly.

### 0.7 — First real ASR adapter

- Behind the existing `AsrProvider` interface, land one real adapter (e.g.
  `whisper.cpp` local, `faster-whisper`, or a cloud speech API) while keeping
  manual timelines fully functional without transcription.

---

## Known technical debt

- **Version drift.** Root `package.json` is `0.0.1` (private) while the published
  `henshusha` is `0.5.1`; the policy is undocumented (see seed S10).
- **Timeline schema versioning.** `version: "0.1"` has no documented upgrade/migration
  path for future breaking changes.
- **Test surface.** Init flows and timeline validation are covered; `doctor:updates`
  and render-plan determinism have little dedicated coverage.
- **Single-project examples.** Fixture and starter only demonstrate one
  `projects/sample-video` layout; multi-project and non-9:16 variants are missing.
- **Remotion lib boundary.** `docs/remotion.md` describes the in-workspace path but
  does not cross-link `render-verification.md` or clarify what `@henshusha/remotion`
  defers.

---

## Areas needing improvement

- **Docs:** version-source policy; Remotion live-vs-deferred boundary with cross-links.
- **Tests:** `doctor:updates` smoke in `pnpm test:henshusha`; cross-platform smoke
  for `doctor:updates`.
- **Examples:** a non-9:16 variant and a multi-project workspace example beyond
  `projects/sample-video`.
- **Observability:** structured render-job logging and a clearer `jobs/` artifact
  contract.

---

## Completed seeds (merged)

These seeds were promoted and merged; kept here for audit trail.

| Seed | Summary | Merged via |
| --- | --- | --- |
| S1 | Sync README "Status" with shipped reality | prior maintenance |
| S2 | Reconcile `docs/roadmap.md` with shipped milestones | DOT-1552 |
| S3 | Label stub packages in their READMEs | DOT-1694 |
| S4 | Extend Timeline JSON validation tests | DOT-932 / CI wiring |
| S8 | Surface ROADMAP.md from the README | prior maintenance |
| S9 | Tidy Dependabot commit-message prefix | DOT-1589 |

---

## Maintenance seed backlog

Each seed is bounded to **30–90 minutes** and includes acceptance criteria so the
weekly planner can promote it directly into a backlog issue. Seeds are independent;
pick any one.

### S5 — Add a `henshusha doctor:updates` smoke test

**Why.** `doctor:updates` is a user-facing command documented in README and skills,
but it is not exercised in `pnpm test:henshusha`; regressions would go unnoticed.

**Scope.** Extend the CLI entry regression (`scripts/verify-henshusha-cli-entry.mjs`
or the init test) to run `doctor:updates` against a fresh fixture and assert exit 0.

**Acceptance.**
- `pnpm test:henshusha` includes a `doctor:updates` assertion that passes locally.

**Effort.** ~45–75 min.

### S6 — Document the Remotion integration boundary

**Why.** Contributors and agents cannot tell which Remotion pieces are live vs
deferred without reading multiple docs; the stub `@henshusha/remotion` package adds
confusion.

**Scope.** Expand `docs/remotion.md` with a short "Integration boundary" section
clarifying what the CLI emits (`timeline-props.json`), what is rendered in-workspace
via Remotion, and what the `@henshusha/remotion` lib package defers.

**Acceptance.**
- A reader can tell which Remotion pieces are live vs future.
- Cross-links `render-verification.md`.

**Effort.** ~45–60 min.

### S7 — Multi-project workspace example

**Why.** The starter only demonstrates a single 9:16 project; agents need a reference
for workspaces with multiple videos or different aspect ratios.

**Scope.** Add a second project (e.g. `projects/short-clip`) to the fixture or
`examples/` with a different aspect ratio, and verify `validate` runs on both.

**Acceptance.**
- `pnpm dev:fixture` (or `examples/`) contains ≥2 projects.
- `validate` succeeds on each from the workspace root.

**Effort.** ~60–90 min.

### S10 — Document the monorepo version policy

**Why.** Root `package.json` stays at `0.0.1` while `packages/henshusha` is `0.5.1`;
new contributors assume a versioning bug.

**Scope.** Add a short note to `docs/contributing.md` (or `docs/development.md`)
explaining that the root `package.json` stays at `0.0.1` (private) and only
`packages/henshusha/package.json` is the published version source.

**Acceptance.**
- One paragraph states the version-source rule and points at the publish workflow.

**Effort.** ~20–30 min.

### S11 — Document Timeline JSON schema migration path

**Why.** `version: "0.1"` has no upgrade story; future breaking changes would
strand existing workspaces.

**Scope.** Add a short section to `docs/timeline-json.md` describing how future
schema versions will be introduced, validated, and migrated.

**Acceptance.**
- One section covers version field semantics and a placeholder migration policy.
- Cross-links the validator in `@henshusha/timeline`.

**Effort.** ~30–45 min.

### S12 — Cross-platform embedded-init smoke note

**Why.** Embedded `init` must work on Bun, pnpm, and npx across Ubuntu/macOS/Windows;
failures are hard to reproduce without a documented QA checklist.

**Scope.** Extend `docs/embedded-init-qa.md` with a minimal matrix (runtime × OS)
and the exact commands to verify a fresh scaffold.

**Acceptance.**
- Checklist covers Bun, pnpm, and npx on Ubuntu, macOS, and Windows.
- Links to the cross-platform CI workflow that already runs init smoke.

**Effort.** ~45–60 min.

---

## How seeds become work

1. The weekly maintenance planner picks one seed from the backlog above.
2. It is promoted into a bounded Multica issue (DOT-xxx) with these acceptance
   criteria copied in.
3. The implementing agent opens a PR titled `DOT-xxx: <seed summary>` against
   `main`, following the repo's existing PR convention.
4. On merge, record the `DOT-xxx` issue or PR in `Merged via`, move the seed to
   [Completed seeds](#completed-seeds-merged), and promote the next seed.

## Maintainer ownership

The human maintainer owns: release/publish, npm trusted-publishing config,
secrets/billing, and final scope decisions for each release. AI agents own
bounded implementation, docs, tests, and PR delivery within the seeds above.
