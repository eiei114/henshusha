---
name: henshusha-analyze-source
description: Inspect a source video/audio file, extract audio, run the configured ASR provider, and create a Henshusha transcript plus Timeline JSON skeleton.
---

# Henshusha Analyze Source

Use when the user asks to analyze a source media file, transcribe audio, or start a new video edit from raw media.

## Workflow

1. Locate source media under `sources/raw/`.
2. Inspect media streams with FFmpeg/ffprobe tooling.
3. Extract audio into a generated cache path.
4. Run the configured ASR provider.
5. Normalize transcript segments and word timings.
6. Create `transcripts/*.json` and `timelines/*.timeline.json`.
7. Report low-confidence words, silence sections, and suggested edit hooks.

Do not modify raw source files.
