---
name: henshusha-render
description: Validate a Henshusha Timeline JSON file and render an MP4 using Remotion and FFmpeg.
---

# Henshusha Render

Use when the user asks to render, export, preview output, or create final MP4 variants.

## Workflow

1. Identify the target video project under `projects/<project-name>/`.
2. Validate the selected Timeline JSON.
3. Confirm render variant, narration audio, and output path.
4. Render visuals with Remotion.
5. Mux and normalize audio with FFmpeg.
6. Write output under the target video project's `renders/`.
7. Report output path, duration, resolution, and any warnings.
