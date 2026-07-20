# Changelog

## Unreleased

## 0.5.1 - 2026-07-21

- Publish the missed patch release after reconciling public workspace packages with the managed npm inventory.

## 0.5.0 - 2026-07-08

- Add embedded `henshusha init` release boundary: interactive agent checkbox TUI on TTY, `.henshusha/manifest.json` install records, skill collision reporting with `--force`, and `init --dry-run`.
- Document standalone vs embedded init modes in CLI help and package README.
- Extend `pnpm test:henshusha` coverage for init dry-run, manifest writes, and post-init `render --dry-run`.

## 0.4.10 - 2026-07-06

- Stabilize Timeline JSON validation with actionable JSON-path errors and gap/overlap warnings shared by `@henshusha/timeline` and `henshusha validate`.
- Align `docs/timeline-json.md` with the starter `main.timeline.json` and document FFmpeg gap/overlap behavior plus future transcript-to-caption mapping.
- Add `pnpm test:timeline-schema` regression checks for the canonical schema.

## Unreleased (prior)

- Add Buy Me a Coffee sponsor button to README and native GitHub funding link via `.github/FUNDING.yml`.
