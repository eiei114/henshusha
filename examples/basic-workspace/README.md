# Henshusha workspace

This is an agent-native video editing workspace.

The workspace root contains shared config and agent skills. Create one folder per video or series under `projects/`.

```txt
projects/
  sample-video/
    sources/raw/      # original media; do not edit in place
    scripts/          # edit plans and human-written scripts
    transcripts/      # future ASR outputs
    timelines/        # Timeline JSON source of truth
    renders/          # exported MP4s
    jobs/             # generated job files
```

Start by opening this workspace with Claude Code, Codex, or Pi, then ask an agent to work on `projects/sample-video`.

`npx henshusha my-studio` installs workspace dependencies and runs `git init` by default, so Remotion preview and GitHub setup are ready immediately. Use `--no-install` or `--no-git` if you want to skip either step.

MVP path:

1. Put a video at `projects/sample-video/sources/raw/input.mp4`.
2. Draft digest beats in `projects/sample-video/scripts/digest-story.md`.
3. Edit `projects/sample-video/scripts/edit-plan.md`.
4. Convert the plan into `projects/sample-video/timelines/main.timeline.json`.
5. Run `npm run validate`.
6. Run `npm run render:dry-run` to inspect `projects/sample-video/jobs/render-plan.json`.
7. Run `npm run remotion:props` for Remotion preview.
8. Run `npm run render` when FFmpeg is installed.

Check for package updates any time:

```bash
npm run doctor:updates
```

## Remotion preview/render

The starter includes a Remotion composition under `projects/sample-video/remotion/`.

```bash
npm run remotion:props
npm run remotion:preview
npm run remotion:render
```

`remotion:props` converts `timelines/main.timeline.json` into `remotion/timeline-props.json`. The Remotion template reads that file and uses the video project folder as the static-file public directory.

### Rich text templates

The sample project also includes reusable Remotion text components in `projects/sample-video/remotion/text-templates.tsx`.
Pick a template by setting `preset` on any `title` or `caption` timeline item:

```json
{ "start": 0, "end": 2, "text": "素材から\nストーリーへ", "preset": "headline-pop", "label": "HOOK", "accent": "#ffcf33" }
```

Bundled presets:

- `headline-pop` / `bold-center` — animated center headline with a small label pill.
- `bottom-caption` — large readable subtitle bubble.
- `karaoke-caption` — subtitle bubble with a timed progress underline.
- `lower-third` — left-aligned name/title card; optional `speaker`.
- `quote-card` — centered white quote card.

Optional fields are Remotion-only styling hints: `accent`, `label`, and `speaker`. FFmpeg render still uses the stable MVP text overlay path, while Remotion preview/render uses these richer components.

Use the bundled `henshusha-digest-story` skill when you want an agent to turn rough footage into a 3-5 beat story/digest quickly.
