---
name: henshusha-edit-timeline
description: Convert a manual edit plan into Henshusha Timeline JSON with video cuts, title overlays, and caption overlays.
---

# Henshusha Edit Timeline

Use when the user wants to cut a source video, add midway titles, add captions, or prepare a manual timeline for render.

## Workflow

1. Identify the target video project under `projects/<project-name>/`.
2. Read `scripts/edit-plan.md` first; create or update it if the edit intent is still vague.
3. Convert cuts into a `video` track in `timelines/main.timeline.json`.
4. Convert center headings into a `title` track.
5. Convert lower-third text into a `caption` track.
6. Run `npx henshusha validate projects/<project-name>` before render.
7. Summarize the exact source ranges, output timing, and overlay text.

Do not invent Whisper/ASR timings. Use explicit manual timings from the edit plan.
