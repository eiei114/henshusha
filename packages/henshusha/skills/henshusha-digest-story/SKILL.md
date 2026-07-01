---
name: henshusha-digest-story
description: Create a short digest/story video from raw footage using Henshusha's manual edit plan, Timeline JSON, FFmpeg render, and optional Remotion preview/render path.
---

# Henshusha Digest Story

Use when the user wants to quickly make a digest, highlight reel, story cut, recap, short video, or editing demo from existing footage.

## Goal

Make editing feel simple:

raw video → 3-5 story beats → `scripts/digest-story.md` → `scripts/edit-plan.md` → `timelines/main.timeline.json` → dry-run → FFmpeg MP4 and optional Remotion preview/render.

## Workflow

1. Identify the target video project under `projects/<project-name>/` (default: `projects/sample-video`).
2. Confirm source media under `sources/raw/`.
3. Create or update `scripts/digest-story.md` with 3-5 beats:
   - hook: why this video matters
   - context: what is being shown
   - key moment: the strongest clip
   - payoff: what changed or what viewer should remember
   - outro: short closing line
4. Convert those beats into `scripts/edit-plan.md`:
   - each beat gets a source time range
   - each beat gets output timing
   - titles are center overlays
   - captions are lower-third overlays
5. Encode the plan into `timelines/main.timeline.json` using only manual timings.
6. Run `npx henshusha validate projects/<project-name>`.
7. Run `npx henshusha render projects/<project-name> --dry-run` and inspect `jobs/render-plan.json`.
8. Run `npx henshusha remotion-props projects/<project-name>` so Remotion can preview the same story timeline.
9. If FFmpeg is available, run `npx henshusha render projects/<project-name>` to produce `renders/output.mp4`.
10. If Remotion deps are installed, offer:
    - `npm run remotion:preview`
    - `npm run remotion:render`

## Story beat template

Use this shape in `scripts/digest-story.md`:

```md
# Digest Story

## Intent
- Audience:
- Promise:
- Target length:

## Beats
1. Hook — 0:00-0:02 — title overlay — why watch now
2. Context — 0:02-0:04 — caption overlay — setup
3. Key moment — 0:04-0:07 — caption overlay — strongest evidence
4. Payoff — 0:07-0:09 — title/caption overlay — lesson or reveal
5. Outro — 0:09-0:10 — caption overlay — closing

## Source ranges
- raw/source.mp4 00:00:00-00:00:02 -> Hook
- raw/source.mp4 00:00:02-00:00:04 -> Context
- raw/source.mp4 00:00:04-00:00:07 -> Key moment
- raw/source.mp4 00:00:07-00:00:09 -> Payoff
- raw/source.mp4 00:00:09-00:00:10 -> Outro
```

## Boundaries

- Do not run Whisper, ASR, TTS, VOICEVOX, or Zundamon in this MVP flow.
- Do not invent precise source timings when the source video has not been inspected; ask for timings or create placeholders clearly marked TODO.
- Timeline JSON remains source of truth for render.
- Remotion props are derived artifacts, not the editing source of truth.
