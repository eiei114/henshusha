---
name: henshusha-render
description: Validate a Henshusha Timeline JSON file and render an MP4 using Remotion and FFmpeg.
---

# Henshusha Render

Use when the user asks to render, export, preview output, or create final MP4 variants.

## Workflow

1. Validate the selected Timeline JSON.
2. Confirm render variant and output path.
3. Render visuals with Remotion.
4. Mux and normalize audio with FFmpeg.
5. Write output under `renders/`.
6. Report output path, duration, resolution, and any warnings.
