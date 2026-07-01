---
name: henshusha-edit-timeline
description: Clean captions, split subtitle cues, choose render variants, tune narration timing, and update a Henshusha Timeline JSON file.
---

# Henshusha Edit Timeline

Use when the user wants to improve subtitles, pick a cut, create a short, tune Japanese narration, or prepare a timeline for render.

## Workflow

1. Identify the target video project under `projects/<project-name>/`, then read its `timelines/*.timeline.json`.
2. Clean transcript or narration text without losing meaning.
3. Split subtitle cues by timing, reading speed, Japanese line length, and screen safe area.
4. Mark important words for highlight when useful.
5. Choose or update render variant: 16:9, 9:16, or 1:1.
6. Apply an art direction preset such as `yukkuri-zundamon-lite` when appropriate.
7. Save the updated timeline and summarize changes.
