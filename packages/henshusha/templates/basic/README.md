# Henshusha workspace

This is an agent-native video editing workspace.

The workspace root contains shared config and agent skills. Create one folder per video or series under `projects/`.

```txt
projects/
  sample-video/
    sources/raw/      # original media; do not edit in place
    scripts/          # narration scripts
    voices/           # provider-neutral voice presets
    transcripts/      # ASR / TTS timing outputs
    timelines/        # Timeline JSON source of truth
    renders/          # exported MP4s
    jobs/             # generated job files
```

Start by opening this workspace with Claude Code, Codex, or Pi, then ask an agent to work on `projects/sample-video`.
