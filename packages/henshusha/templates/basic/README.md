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

MVP path:

1. Put a video at `projects/sample-video/sources/raw/input.mp4`.
2. Draft digest beats in `projects/sample-video/scripts/digest-story.md`.
3. Edit `projects/sample-video/scripts/edit-plan.md`.
4. Convert the plan into `projects/sample-video/timelines/main.timeline.json`.
5. Run `npx henshusha validate projects/sample-video`.
6. Run `npx henshusha render projects/sample-video --dry-run` to inspect `projects/sample-video/jobs/render-plan.json`.
7. Run `npx henshusha remotion-props projects/sample-video` for Remotion preview.
8. Run `npx henshusha render projects/sample-video` when FFmpeg is installed.

## Remotion preview/render

The starter includes a Remotion composition under `projects/sample-video/remotion/`.

```bash
npm install
npm run remotion:props
npm run remotion:preview
npm run remotion:render
```

`remotion:props` converts `timelines/main.timeline.json` into `remotion/timeline-props.json`. The Remotion template reads that file and uses the video project folder as the static-file public directory.

Use the bundled `henshusha-digest-story` skill when you want an agent to turn rough footage into a 3-5 beat story/digest quickly.
