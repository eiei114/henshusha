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
2. Edit `projects/sample-video/scripts/edit-plan.md`.
3. Convert the plan into `projects/sample-video/timelines/main.timeline.json`.
4. Run `npx henshusha validate projects/sample-video`.
5. Run `npx henshusha render projects/sample-video --dry-run` to inspect `projects/sample-video/jobs/render-plan.json`.
6. Run `npx henshusha render projects/sample-video` when FFmpeg is installed.
