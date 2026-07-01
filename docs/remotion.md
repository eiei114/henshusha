# Remotion integration

Henshusha generated workspaces include an optional Remotion path for richer visual composition. The current canonical editing artifact remains Timeline JSON.

## Flow

```bash
npx henshusha remotion-props projects/sample-video
npm run remotion:preview
npm run remotion:render
```

`remotion-props` converts `timelines/main.timeline.json` into `remotion/timeline-props.json`. The Remotion root reads that file, renders manual video cuts with `OffthreadVideo`, and overlays title/caption tracks with React/CSS.

## Static files

The starter `remotion.config.ts` sets `projects/sample-video` as the Remotion public directory, so `sources/raw/input.mp4` can be loaded through `staticFile()`.

Future work should make the public directory project-selectable for arbitrary project names.

## Current boundary

- FFmpeg render remains the stable MVP export path.
- Remotion is now available in the starter for preview/richer composition.
- ASR, Whisper, TTS, and VOICEVOX remain deferred.
