# Timeline JSON

Draft canonical editing format for the manual cut + overlay MVP.

Timeline files usually live at `projects/<project-name>/timelines/*.timeline.json`. Relative paths are resolved from the video project folder, not the workspace root.

The starter ships `projects/sample-video/timelines/main.timeline.json` as the reference shape:

```json
{
  "version": "0.1",
  "source": {
    "path": "sources/raw/input.mp4"
  },
  "timeline": {
    "duration": 10,
    "tracks": [
      {
        "id": "video",
        "type": "video",
        "items": [
          {
            "source": "sources/raw/input.mp4",
            "sourceStart": 0,
            "start": 0,
            "end": 2
          },
          {
            "source": "sources/raw/input.mp4",
            "sourceStart": 2,
            "start": 2,
            "end": 4
          },
          {
            "source": "sources/raw/input.mp4",
            "sourceStart": 4,
            "start": 4,
            "end": 7
          },
          {
            "source": "sources/raw/input.mp4",
            "sourceStart": 7,
            "start": 7,
            "end": 9
          },
          {
            "source": "sources/raw/input.mp4",
            "sourceStart": 9,
            "start": 9,
            "end": 10
          }
        ]
      },
      {
        "id": "titles",
        "type": "title",
        "items": [
          {
            "start": 0,
            "end": 2,
            "text": "素材から\nストーリーへ",
            "preset": "headline-pop",
            "label": "HOOK",
            "accent": "#ffcf33"
          },
          {
            "start": 7,
            "end": 9,
            "text": "FFmpegでMVPを書き出し",
            "preset": "lower-third",
            "speaker": "Henshusha",
            "accent": "#ff4f9a"
          }
        ]
      },
      {
        "id": "captions",
        "type": "caption",
        "items": [
          {
            "start": 2,
            "end": 4,
            "text": "ビートを手で決める",
            "preset": "karaoke-caption",
            "accent": "#45d7ff"
          },
          {
            "start": 4,
            "end": 7,
            "text": "Timeline JSON が編集の正本",
            "preset": "bottom-caption"
          },
          {
            "start": 9,
            "end": 10,
            "text": "Remotionで次の表現へ",
            "preset": "quote-card",
            "accent": "#ffcf33"
          }
        ]
      }
    ]
  },
  "render": {
    "output": "renders/output.mp4",
    "variant": {
      "aspect": "9:16",
      "resolution": "1080x1920",
      "safeArea": "short-video"
    },
    "artDirection": {
      "preset": "digest-story",
      "captionStyle": "large-ja-subtitles"
    }
  }
}
```

## Track types

- `video`: explicit manual cuts. `sourceStart` is the source video offset. `start` / `end` are output timeline positions.
- `title`: centered title overlays.
- `caption`: lower-third caption overlays. Manual caption tracks are first-class; ASR is not required.

Optional styling fields on `title` / `caption` items: `preset`, `accent`, `label`, `speaker`.

## Validation

Run `henshusha validate projects/<project-name>` before render. Validation errors include JSON paths and fix hints (for example, which field to set on a caption item).

Warnings do not block render. They flag timeline shapes the FFmpeg MVP does not preserve yet.

## FFmpeg renderer: gaps and overlaps

The first FFmpeg renderer concatenates `video` items in array order:

1. Each item is trimmed from `sourceStart` for `(end - start)` seconds.
2. Segments are concatenated back-to-back with no inserted black frames.
3. `title` and `caption` items are burned in as overlays on the concatenated video.

Implications:

- **Gaps** (for example, an item starts at `6` after the previous item ends at `4`): validation warns that the gap is ignored. Output duration equals the sum of segment lengths, not the last `end` timestamp.
- **Overlaps** (an item starts before the previous item ends): validation warns that segments still play sequentially; overlapping source ranges are not blended.
- **`timeline.duration`**: optional and informational. If present, it must be a finite number. FFmpeg uses concatenated segment lengths. A warning appears when `duration` differs from the last video item `end`.
- **Mixed sources**: the renderer opens a single input — the first video item's `source` (falling back to `source.path`) — and trims every segment from that input. Per-item `source` values are accepted by the schema so a future renderer can honor them, but the current FFmpeg renderer ignores them for every item after the first. Validation warns when video items resolve to more than one distinct source, naming the item path, the item source, and the first source.

  Only one source is current-render-safe. Split a multi-source edit into one timeline per source, or point every item at the same file (`sourceStart` can still differ).

Example that validates but warns about the ignored second source:

```json
{
  "id": "video",
  "type": "video",
  "items": [
    { "source": "sources/raw/intro.mp4", "start": 0, "end": 4, "sourceStart": 0 },
    { "source": "sources/raw/body.mp4", "start": 4, "end": 10, "sourceStart": 0 }
  ]
}
```

Fix: render `sources/raw/body.mp4` in a second project/timeline, or convert both sources into a single concatenated source file before editing.

Example gap that validates but warns:

```json
{
  "id": "video",
  "type": "video",
  "items": [
    { "start": 0, "end": 4, "sourceStart": 0 },
    { "start": 6, "end": 10, "sourceStart": 6 }
  ]
}
```

Fix: set the second item `start` to `4`, or insert a video segment that covers `4–6`.

## Special characters in caption text

Caption/title text is written as UTF-8 in `jobs/drawtext-text/overlay-<n>.txt` and passed to FFmpeg through drawtext's `textfile` option. This keeps user text out of the nested filtergraph quoting and option-parsing layers.

- Apostrophes (`'`), percent signs (`%` and `%{...}`), colons (`:`), and backslashes (`\\`) are retained literally in the text file. `expansion=none` prevents drawtext from expanding percent sequences.
- A JSON `\n` escape becomes an actual line feed when the timeline is read and is retained as a line break in the UTF-8 text file.
- The FFmpeg command in `jobs/render-plan.json` uses text-file paths relative to the project root; its `ffmpeg.cwd` field shows the directory from which those paths resolve.

### Example

A caption with `It's 50% off: C:\\temp\\{now}` produces a drawtext filter similar to:

```
drawtext=expansion=none:textfile='jobs/drawtext-text/overlay-0.txt':fontsize=54:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=28:x=(w-text_w)/2:y=h-(text_h*3):enable='between(t,0,5)'
```

The sidecar contains the exact UTF-8 caption `It's 50% off: C:\\temp\\{now}`; `expansion=none` keeps `%{...}` literal. Newlines are stored as actual line feeds, not the two-character sequence `\\n`.

## Future transcript-derived captions

Whisper/ASR is deferred for the MVP. When added later, adapters should:

1. Write raw segments to `transcript` (optional provenance):

```json
"transcript": {
  "language": "ja",
  "segments": [
    { "start": 2.0, "end": 4.0, "text": "ビートを手で決める", "speaker": "host" }
  ]
}
```

2. Map each segment into the same `caption` track item shape used by manual editing:

```json
{
  "start": 2,
  "end": 4,
  "text": "ビートを手で決める",
  "preset": "bottom-caption"
}
```

Rendering continues to read `timeline.tracks` (especially `caption` items), not `transcript` directly. Agents can keep editing caption text/timing after ASR import.

## Deferred features

Narration, VOICEVOX/Zundamon, Whisper runtime, and word-level karaoke timings remain deferred. The MVP uses explicit manual cuts and overlay timings from `scripts/edit-plan.md`.
