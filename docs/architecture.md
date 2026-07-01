# Architecture

## Product shape

Henshusha is a workspace starter. The CLI exists to support agent skills; the primary editing experience is through Claude Code, Codex, and Pi.

## Data flow

```txt
Source media
  -> ffprobe / audio extract
  -> ASR Provider
  -> normalized transcript
  -> Timeline JSON
  -> agent edits
  -> Remotion render
  -> FFmpeg export
```

## Source of truth

`timelines/*.timeline.json` is the editing source of truth. Raw ASR output is an input, not the canonical project state.

## ASR provider abstraction

OpenAI Whisper should not be a hard dependency. The MVP should support a provider interface so OpenAI, local whisper.cpp, faster-whisper, WhisperX, or cloud speech APIs can be added behind one normalized result shape.

## Render variants

Aspect ratio and art direction are job-level choices, not project-wide constants. The same timeline should be able to render 16:9, 9:16, or 1:1 variants.

## Workspace and video project boundaries

A Henshusha workspace is the root opened by Claude Code, Codex, or Pi. Agent skills live at the workspace root. Individual videos or series live below `projects/<project-name>/`. Paths inside a Timeline JSON are interpreted relative to the containing video project unless they are absolute.

The starter keeps Japanese narration provider-neutral: `voicevox-compatible` identifies the adapter family, while speaker IDs remain adapter-specific config outside the canonical Timeline JSON.
