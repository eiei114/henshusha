# Render verification

This document describes how to verify the Manual Timeline Cut + Overlay MVP with a real local `ffmpeg` install.

## Prerequisites

- Node.js 20+ (or Bun 1.3+)
- `ffmpeg` and `ffprobe` on `PATH`

Check tooling:

```bash
pnpm build
node packages/henshusha/dist/index.js doctor
```

`henshusha doctor` prints the detected `ffmpeg` / `ffprobe` versions. If either tool is missing, follow the install hints printed by doctor.

## Sample media fixture

The repository does not commit binary MP4 fixtures. Instead, contributors generate a tiny 10-second sample clip locally:

```bash
pnpm dev:fixture
# or only the media file:
pnpm dev:sample-media
```

This writes `.fixtures/basic-workspace/projects/sample-video/sources/raw/input.mp4` using FFmpeg lavfi sources (blue color + sine tone). The fixture directory stays gitignored.

## Manual render smoke test

```bash
cd .fixtures/basic-workspace
node ../../packages/henshusha/dist/index.js render projects/sample-video
ffprobe -hide_banner -show_streams -show_format projects/sample-video/renders/output.mp4
```

Expected output characteristics:

- Video: `h264`, `1080x1920`
- Audio: `aac` when the source clip includes audio
- Duration: about 10 seconds for the bundled `main.timeline.json`

## Automated verification

```bash
pnpm build
pnpm dev:verify-render
```

`dev:verify-render` runs doctor, regenerates the fixture media, renders `projects/sample-video`, and validates the output with `ffprobe`.

## Audio / no-audio inputs

The MVP renderer probes the primary source file with `ffprobe` before building the FFmpeg filter graph.

- **Audio present:** video segments are trimmed and concatenated with matching audio (`atrim` + `concat` with `a=1`), then encoded to AAC.
- **No audio stream:** the renderer emits a video-only output and skips audio mapping/encoding. A warning is printed during `henshusha render`.

Separate audio tracks via `timeline.source.audio` are not merged yet; that remains a follow-up enhancement.

## Semver note

Patch releases are appropriate when render behavior changes (for example, no-audio handling). Update `packages/henshusha/package.json` before merging behavior changes that should ship through npm.
