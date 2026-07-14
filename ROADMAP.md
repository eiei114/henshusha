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

---

## Current release status

| Item | State |
| --- | --- |
| npm package `henshusha` | **`0.5.0`** (`latest`, published 2026-07-08, tag `v0.5.0`) |
| Release boundary | Embedded `henshusha init` (interactive agent TUI, install manifest, `--force`, `--dry-run`) |
| Manual edit pipeline | **Live** — Timeline JSON → FFmpeg cut + overlay render, `validate` / `render` / `remotion-props` / `doctor:updates` |
| Timeline JSON schema | **Stabilized** (`@henshusha/timeline` validator, actionable JSON-path errors, gap/overlap warnings) |
| Agent skills | 3 shipped via embedded init: `analyze-source`, `edit-timeline`, `render` |
| ASR (speech-to-text) | **Deferred** — provider interface + `MockAsrProvider` only, no real adapter |
| Remotion render | **Partial** — CLI emits `timeline-props.json`; in-workspace Remotion render is the manual path, the `@henshusha/remotion` lib package is a stub |
| CI / automation | CI on PR + `main`, cross-platform smoke (Ubuntu/macOS/Windows), npm Trusted Publishing (OIDC), Dependabot, dependency review |
| Open issues / PRs | None at the time of writing |

### Shipped capability (0.5.0)

- `bunx henshusha@latest <name>` scaffolds a multi-project workspace with
  `projects/sample-video/`, workspace config, and per-agent skills.
- Project-local `henshusha` CLI: `validate`, `render` (FFmpeg cut + overlay),
  `remotion-props`, `doctor:updates`, and the embedded `init`.
- Timeline JSON (`version: "0.1"`) is the editing source of truth, validated
  with gap/overlap warnings.
- 10 packages are declared in the monorepo, but **only two have real
  implementations** today: `henshusha` (the starter/CLI) and `@henshusha/timeline`
  (the validator). See [Package maturity](#package-maturity).

### Package maturity

| Package | npm version | Implementation |
| --- | --- | --- |
| `henshusha` | `0.5.0` | Full — starter + project-local CLI |
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
- Bring README, `docs/roadmap.md`, and package READMEs in line with what actually
  shipped (the MVP render pipeline is live, not future).
- Make the roadmap self-maintaining via the seed backlog below.

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

- **Stale status copy.** README "Status" still reads "Planning / bootstrap. First
  milestone: render one captioned MP4" even though the FFmpeg cut + overlay render
  is live since 0.4.x.
- **Stale phase doc.** `docs/roadmap.md` leaves shipped items (scaffolder, timeline
  schema, agent skills) unchecked.
- **Stub-vs-real ambiguity.** 8 of 10 packages are `0.0.0` stubs, but the README
  "Packages" list describes them as if functional. Contributors cannot tell which
  are placeholders from the README alone.
- **Version drift.** Root `package.json` is `0.0.1` (private) while the published
  `henshusha` is `0.5.0`; the policy is undocumented.
- **Timeline schema versioning.** `version: "0.1"` has no documented upgrade/migration
  path for future breaking changes.
- **Test surface.** Init flows are covered; timeline validation edge cases, render
  plan generation, and `doctor:updates` have little dedicated coverage.
- **Dependabot commit prefix.** Recent dep PRs land as `chore(deps)(deps-dev): …`
  (double parentheses) from the group config.

---

## Areas needing improvement

- **Docs:** single source of truth for status/roadmap; accurate package maturity;
  clear "what is live vs deferred" for Remotion and ASR.
- **Tests:** validation edge cases, render-plan determinism, cross-platform smoke
  for `doctor:updates`.
- **Examples:** a non-9:16 variant and a multi-project workspace example beyond
  `projects/sample-video`.
- **Observability:** structured render-job logging and a clearer `jobs/` artifact
  contract.

---

## Maintenance seed backlog

Each seed is bounded to **30–90 minutes** and includes acceptance criteria so the
weekly planner can promote it directly into a backlog issue. Seeds are independent;
pick any one.

### S1 — Sync README "Status" with shipped reality
**Scope.** Rewrite the README "Status" section so it no longer frames the MVP
render pipeline as future work; state that the manual Timeline → FFmpeg pipeline
is live (0.5.0) and the current focus is embedded-init stabilization + docs.
**Acceptance.**
- README "Status" reflects 0.5.0 shipped capability.
- No claim that "render one captioned MP4" is the first milestone.
- `pnpm typecheck` unchanged; README renders correctly.
**Effort.** ~30–45 min.

### S2 — Reconcile `docs/roadmap.md` with shipped milestones
**Scope.** Check off Phase 0/1 items that shipped (scaffolder, timeline schema,
agent skills, FFmpeg render) and add a pointer to this root `ROADMAP.md` as the
source of truth.
**Acceptance.**
- No shipped item appears unchecked.
- Top of `docs/roadmap.md` links to `../ROADMAP.md`.
**Effort.** ~45–60 min.

### S3 — Label stub packages in their READMEs
**Scope.** Add a one-line "Status: interface/stub — not yet published" note to the
8 stub package READMEs (`core`, `asr`, `ffmpeg`, `remotion`, `components`,
`templates`, `agent-kit`, `cli`) so readers know which packages are placeholders.
**Acceptance.**
- Each stub README states current implementation status.
- `henshusha` and `@henshusha/timeline` are the only packages described as functional.
**Effort.** ~45–75 min.

### S4 — Extend Timeline JSON validation tests
**Scope.** Add cases to `scripts/verify-timeline-schema.mjs` (or a sibling test)
for an overlap warning, a gap warning, and at least one invalid-schema rejection
with an actionable JSON-path error.
**Acceptance.**
- `pnpm test:timeline-schema` covers ≥1 overlap, ≥1 gap, ≥1 rejection.
- Passes on Ubuntu and Windows.
**Effort.** ~60–90 min.

### S5 — Add a `henshusha doctor:updates` smoke test
**Scope.** Extend the CLI entry regression (`scripts/verify-henshusha-cli-entry.mjs`
or the init test) to run `doctor:updates` against a fresh fixture and assert exit 0.
**Acceptance.**
- `pnpm test:henshusha` includes a `doctor:updates` assertion that passes locally.
**Effort.** ~45–75 min.

### S6 — Document the Remotion integration boundary
**Scope.** Add a short section to `docs/remotion.md` clarifying what the CLI emits
(`timeline-props.json`), what is rendered in-workspace via Remotion, and what the
`@henshusha/remotion` lib package defers.
**Acceptance.**
- A reader can tell which Remotion pieces are live vs future.
- Cross-links `render-verification.md`.
**Effort.** ~45–60 min.

### S7 — Multi-project workspace example
**Scope.** Add a second project (e.g. `projects/short-clip`) to the fixture or
`examples/` with a different aspect ratio, and verify `validate` runs on both.
**Acceptance.**
- `pnpm dev:fixture` (or `examples/`) contains ≥2 projects.
- `validate` succeeds on each from the workspace root.
**Effort.** ~60–90 min.

### S8 — Surface ROADMAP.md from the README
**Scope.** Add a "Roadmap" link near the top of `README.md` pointing to
`./ROADMAP.md` so the seed backlog is discoverable.
**Acceptance.**
- README links to `./ROADMAP.md`.
- Markdown link resolves in GitHub render.
**Effort.** ~15 min.

### S9 — Tidy Dependabot commit-message prefix
**Scope.** Update `.github/dependabot.yml` `commit-message.prefix` / grouping so
future dependency PRs avoid the `chore(deps)(deps-dev)` double-paren artifact.
**Acceptance.**
- Config updated; the next generated dep PR uses a clean prefix.
**Effort.** ~15–30 min.

### S10 — Document the monorepo version policy
**Scope.** Add a short note to `docs/contributing.md` (or `docs/development.md`)
explaining that the root `package.json` stays at `0.0.1` (private) and only
`packages/henshusha/package.json` is the published version source.
**Acceptance.**
- One paragraph states the version-source rule and points at the publish workflow.
**Effort.** ~20–30 min.

---

## How seeds become work

1. The weekly maintenance planner picks one seed from the backlog above.
2. It is promoted into a bounded Multica issue (DOT-xxx) with these acceptance
   criteria copied in.
3. The implementing agent opens a PR titled `DOT-xxx: <seed summary>` against
   `main`, following the repo's existing PR convention.
4. On merge, the seed is checked off here and the next seed is promoted.

## Maintainer ownership

The human maintainer owns: release/publish, npm trusted-publishing config,
secrets/billing, and final scope decisions for each release. AI agents own
bounded implementation, docs, tests, and PR delivery within the seeds above.
