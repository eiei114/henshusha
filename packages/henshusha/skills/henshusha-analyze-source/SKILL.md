---
name: henshusha-analyze-source
description: Inspect a source video/audio file, extract audio or synthesize narration, run the configured ASR/TTS provider, and create a Henshusha transcript plus Timeline JSON skeleton.
---

# Henshusha Analyze Source

Use when the user asks to analyze a source media file, transcribe audio, synthesize Japanese narration, or start a new video edit from raw media.

## Workflow

1. Identify the target video project under `projects/<project-name>/` (default: `projects/sample-video`).
2. Locate source media under that project's `sources/raw/` or narration script under `scripts/`.
3. Inspect media streams with FFmpeg/ffprobe tooling when source media exists.
4. Extract audio into a generated cache path, or synthesize narration audio through the configured voice provider.
5. Run the configured ASR/alignment provider when timing data is needed.
6. Normalize transcript segments and word timings.
7. Create `transcripts/*.json` and `timelines/*.timeline.json` inside the target video project.
8. Report low-confidence words, silence sections, voice synthesis warnings, and suggested edit hooks.

Do not modify raw source files.

## Japanese narration path

For script-first Japanese videos, keep the script in `scripts/`, use provider-neutral voice presets in `voices/`, and generate TTS audio/timing through a VOICEVOX-compatible adapter such as Zundamon. Do not hardcode provider-specific speaker IDs in Timeline JSON.
