# henshusha

Create and operate a Henshusha agent-native video editing workspace.

```bash
npx henshusha my-studio
# or
bunx henshusha my-studio
```

The generated workspace is not a single-video project. It is a studio root that can contain many video projects:

```txt
my-studio/
  henshusha.config.json
  projects/
    sample-video/
      sources/raw/
      scripts/edit-plan.md
      transcripts/
      timelines/main.timeline.json
      renders/
      jobs/
  .claude/skills/
  .codex/skills/
  .pi/skills/
```

MVP commands:

```bash
npx henshusha validate projects/sample-video
npx henshusha render projects/sample-video
npx henshusha new-project next-video
```

The first renderer is a manual cut + overlay path: source video clips are concatenated, then title/caption text is overlaid with FFmpeg. Whisper/ASR and VOICEVOX/Zundamon narration are intentionally deferred.
