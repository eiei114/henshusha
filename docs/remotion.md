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

## Integration boundary

Henshusha splits Remotion work across three layers. Use this section to tell which pieces are live today versus deferred.

### What the CLI emits

`henshusha remotion-props [project-dir]` reads validated Timeline JSON and writes a derived props file. The default output is `projects/<name>/remotion/timeline-props.json` (gitignored in generated workspaces because it is regenerated from the timeline).

The emitted JSON uses `kind: "henshusha.remotion-props"` and includes:

- composition metadata (`fps`, `width`, `height`, `durationInFrames`)
- provenance (`projectRoot`, `timelinePath`, `createdAt`)
- the full validated `timeline` object

Timeline JSON remains the editing source of truth. `timeline-props.json` is a render-time bridge artifact, not an alternate edit format.

### What the workspace renders (live)

Generated workspaces ship a Remotion starter under `projects/<name>/remotion/`:

- `Root.tsx` imports `timeline-props.json` and composes video cuts with `OffthreadVideo`
- `text-templates.tsx` renders title/caption presets (`headline-pop`, `bottom-caption`, and the other bundled presets above)
- npm scripts wire the path: `remotion:props`, `remotion:preview`, `remotion:render`

This in-workspace path is the live Remotion integration. Preview and MP4 export run through the workspace's `@remotion/cli` dependency, not through the monorepo library package.

For the stable FFmpeg MVP export path, see [render-verification.md](./render-verification.md).

### What `@henshusha/remotion` defers

The monorepo package `@henshusha/remotion` (`packages/remotion/`) is a stub. It exports only `packageName` today and is not published to npm.

Future work for this package (not implemented):

- shared Remotion bridge code reused across workspaces
- centralized composition primitives (caption/layout helpers belong in `@henshusha/components`; starter compositions belong in `@henshusha/templates`)

Do not expect importing `@henshusha/remotion` from a generated workspace to provide preview or render. Use the scaffolder-delivered `projects/<name>/remotion/` starter and CLI `remotion-props` instead.

### Quick reference

| Piece | Status | Role |
| --- | --- | --- |
| `henshusha remotion-props` | Live | Timeline JSON → `timeline-props.json` |
| Workspace `remotion/` starter | Live | Preview/render with bundled text presets |
| `henshusha render` (FFmpeg) | Live | MVP export; see [render-verification.md](./render-verification.md) |
| `@henshusha/remotion` | Stub | Future shared bridge; no runtime today |
| `@henshusha/templates` / `@henshusha/components` | Stub | Future shared compositions/primitives |

ASR, Whisper, TTS, and VOICEVOX remain deferred across both FFmpeg and Remotion paths.
