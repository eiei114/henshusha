# henshusha

Create and operate a Henshusha agent-native video editing workspace.

```bash
npx henshusha my-studio
# or
bunx henshusha my-studio
```

Scaffolding installs workspace dependencies and runs `git init` by default so the first Remotion preview and GitHub handoff are ready quickly. Use `--no-install` or `--no-git` to opt out.

The generated workspace is not a single-video project. It is a studio root that can contain many video projects:

```txt
my-studio/
  .git/
  .gitattributes
  .gitignore
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
npx henshusha render projects/sample-video --dry-run
npx henshusha render projects/sample-video
npx henshusha remotion-props projects/sample-video
npx henshusha new-project next-video
npx henshusha doctor --updates
```

`render --dry-run` writes `projects/<project>/jobs/render-plan.json` with resolved paths, overlay timings, and the FFmpeg command without requiring FFmpeg to run.

Generated workspaces also include a Remotion starter under `projects/sample-video/remotion/` plus these scripts:

```bash
npm run remotion:props
npm run remotion:preview
npm run remotion:render
```

The Remotion starter includes `text-templates.tsx` with reusable presets for richer text overlays: `headline-pop`, `bottom-caption`, `karaoke-caption`, `lower-third`, and `quote-card`. Set `preset`, plus optional `accent`, `label`, or `speaker`, on `title` / `caption` timeline items to switch the look without rewriting the composition.

The first renderer is a manual cut + overlay path: source video clips are concatenated, then title/caption text is overlaid with FFmpeg. The Remotion path is available for richer visual composition. Whisper/ASR and VOICEVOX/Zundamon narration are intentionally deferred.


Packaged skills include `henshusha-digest-story`, which guides agents through a quick digest workflow: story beats → edit plan → Timeline JSON → FFmpeg dry-run/render → Remotion props/preview.

`doctor --updates` checks npm for a newer `henshusha` package and prints the update command. A full workspace file upgrade command is planned; current generated workspaces keep user-edited files under normal Git control.
