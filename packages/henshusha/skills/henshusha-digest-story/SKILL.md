---
name: henshusha-digest-story
description: Create a short digest/story video from raw footage using Henshusha's manual edit plan, Timeline JSON, FFmpeg render, and optional Remotion preview/render path.
---

# Henshusha Digest Story

Use when the user wants to quickly make a digest, highlight reel, story cut, recap, short video, or editing demo from existing footage.

## Goal

Make editing feel simple and visually satisfying on the first run:

raw video → 3-5 story beats → `scripts/digest-story.md` → `scripts/edit-plan.md` → `timelines/main.timeline.json` with Remotion text presets → dry-run → FFmpeg MP4 and Remotion preview/render.

## Workflow

1. Identify the target video project under `projects/<project-name>/` (default: `projects/sample-video`).
2. Run `npx henshusha doctor --updates` when network access is acceptable. If an update is available, tell the user before editing; do not block the digest if the check fails.
3. Confirm source media under `sources/raw/`.
4. Create or update `scripts/digest-story.md` with 3-5 beats:
   - hook: why this video matters
   - context: what is being shown
   - key moment: the strongest clip
   - payoff: what changed or what viewer should remember
   - outro: short closing line
5. Convert those beats into `scripts/edit-plan.md`:
   - each beat gets a source time range
   - each beat gets output timing
   - hook titles use `headline-pop`
   - context captions use `karaoke-caption` when timing/progress helps
   - ordinary subtitles use `bottom-caption`
   - payoff/title cards can use `lower-third` or `quote-card`
   - add `accent`, `label`, or `speaker` when it clarifies the beat
6. Encode the plan into `timelines/main.timeline.json` using only manual timings.
7. Run `npx henshusha validate projects/<project-name>`.
8. Run `npx henshusha render projects/<project-name> --dry-run` and inspect `jobs/render-plan.json`.
9. Run `npx henshusha remotion-props projects/<project-name>` so Remotion can preview the same story timeline.
10. If FFmpeg is available, run `npx henshusha render projects/<project-name>` to produce `renders/output.mp4`.
11. If Remotion deps are installed, offer:
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
1. Hook — 0:00-0:02 — `headline-pop` title — why watch now
2. Context — 0:02-0:04 — `karaoke-caption` caption — setup
3. Key moment — 0:04-0:07 — `bottom-caption` caption — strongest evidence
4. Payoff — 0:07-0:09 — `lower-third` or `quote-card` — lesson or reveal
5. Outro — 0:09-0:10 — `bottom-caption` caption — closing

## Source ranges
- raw/source.mp4 00:00:00-00:00:02 -> Hook
- raw/source.mp4 00:00:02-00:00:04 -> Context
- raw/source.mp4 00:00:04-00:00:07 -> Key moment
- raw/source.mp4 00:00:07-00:00:09 -> Payoff
- raw/source.mp4 00:00:09-00:00:10 -> Outro
```

## Timeline preset pattern

Use these fields on `title` / `caption` track items whenever possible:

```json
{ "start": 0, "end": 2, "text": "素材から\nストーリーへ", "preset": "headline-pop", "label": "HOOK", "accent": "#ffcf33" }
```

Available starter presets:

- `headline-pop` / `bold-center`: opening hook or big transition.
- `bottom-caption`: readable default subtitle.
- `karaoke-caption`: short caption with a progress underline.
- `lower-third`: named payoff card; use `speaker` when useful.
- `quote-card`: centered quote / memorable conclusion.

If unsure, use: Hook = `headline-pop`, middle captions = `bottom-caption` or `karaoke-caption`, payoff = `lower-third`, outro = `quote-card` or `bottom-caption`.

## Boundaries

- Do not run Whisper, ASR, TTS, VOICEVOX, or Zundamon in this MVP flow.
- Do not invent precise source timings when the source video has not been inspected; ask for timings or create placeholders clearly marked TODO.
- Timeline JSON remains source of truth for render.
- Remotion props are derived artifacts, not the editing source of truth.
