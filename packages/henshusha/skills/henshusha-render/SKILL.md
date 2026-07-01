---
name: henshusha-render
description: Validate a Henshusha manual Timeline JSON file and render an MP4 with FFmpeg cuts plus title/caption overlays.
---

# Henshusha Render

Use when the user asks to render, export, preview output, or create final MP4 variants from a manual timeline.

## Workflow

1. Identify the target video project under `projects/<project-name>/`.
2. Validate with `npx henshusha validate projects/<project-name>`.
3. Preflight with `npx henshusha render projects/<project-name> --dry-run` when FFmpeg is unavailable or the user wants to inspect commands first.
4. Confirm source media exists, FFmpeg is installed, and output path is acceptable.
5. Render with `npx henshusha render projects/<project-name>`.
6. Write output under the target video project's `renders/`.
7. Report output path, duration target, resolution, and any warnings.

## Dry-run output

`--dry-run` writes `projects/<project-name>/jobs/render-plan.json` with resolved source paths, overlay timings, output path, and the FFmpeg command. It does not encode MP4 and does not require FFmpeg to be installed.
