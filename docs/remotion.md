# Remotion integration

Henshusha generated workspaces include an optional Remotion path for richer visual composition. The current canonical editing artifact remains Timeline JSON.

## Flow

```bash
npx henshusha remotion-props projects/sample-video
npm run remotion:preview
npm run remotion:render
```

`remotion-props` converts `timelines/main.timeline.json` into `remotion/timeline-props.json`. The Remotion root reads that file, renders manual video cuts with `OffthreadVideo`, and overlays title/caption tracks with React/CSS.

## Starter text template components

Generated workspaces include reusable Remotion text components at:

```txt
projects/sample-video/remotion/text-templates.tsx
```

Timeline `title` and `caption` items can choose a component with `preset`:

```json
{
  "start": 0,
  "end": 2,
  "text": "素材から\nストーリーへ",
  "preset": "headline-pop",
  "label": "HOOK",
  "accent": "#ffcf33"
}
```

Bundled presets:

- `headline-pop` / `bold-center`: animated center headline with label pill.
- `bottom-caption`: large subtitle bubble.
- `karaoke-caption`: subtitle bubble with timed progress underline.
- `lower-third`: left-aligned info card; supports `speaker`.
- `quote-card`: centered white quote card.

`accent`, `label`, and `speaker` are optional styling hints consumed by Remotion. They are not required by the FFmpeg MVP renderer.

## Static files

The starter `remotion.config.ts` sets `projects/sample-video` as the Remotion public directory, so `sources/raw/input.mp4` can be loaded through `staticFile()`.

Future work should make the public directory project-selectable for arbitrary project names.

## Current boundary

- FFmpeg render remains the stable MVP export path.
- Remotion is available in the starter for preview/richer composition and template-driven text overlays.
- ASR, Whisper, TTS, and VOICEVOX remain deferred.
