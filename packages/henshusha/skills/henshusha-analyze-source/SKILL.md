---
name: henshusha-analyze-source
description: Inspect a target video project, read the human edit plan, confirm source media paths, and prepare manual cut/title/caption timeline inputs.
---

# Henshusha Analyze Source

Use when the user asks to start an edit from raw media, inspect a video project, or turn rough editing intent into a manual edit plan.

## Workflow

1. Identify the target video project under `projects/<project-name>/` (default: `projects/sample-video`).
2. Confirm the source media path under that project's `sources/raw/`.
3. Read or create `scripts/edit-plan.md` before touching Timeline JSON.
4. Capture desired cuts as source time ranges and output order.
5. Capture title/caption overlays as text plus start/end timings.
6. Do not run ASR, Whisper, TTS, or VOICEVOX in the MVP path.
7. Hand off to `henshusha-edit-timeline` to encode the plan as `timelines/main.timeline.json`.

Do not modify raw source files.
