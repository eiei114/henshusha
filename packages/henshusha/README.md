# henshusha

Create a Henshusha agent-native video editing workspace.

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
      scripts/
      voices/
      transcripts/
      timelines/
      renders/
      jobs/
  .claude/skills/
  .codex/skills/
  .pi/skills/
```

The starter includes a Japanese sample project configured for a lightweight Zundamon / Yukkuri-style narration workflow through a provider-neutral `voicevox-compatible` voice preset.
