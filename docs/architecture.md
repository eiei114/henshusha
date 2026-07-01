# Architecture

## Product shape

Henshusha is a workspace starter. The CLI exists to support agent skills; the primary editing experience is through Claude Code, Codex, and Pi.

## Data flow

```txt
Source media
  -> manual edit plan
  -> Timeline JSON
  -> agent edits
  -> FFmpeg cut + overlay render
```

## Source of truth

`timelines/*.timeline.json` is the editing source of truth. For the MVP, it is derived from a human edit plan rather than ASR output.

## Deferred ASR provider abstraction

OpenAI Whisper is not part of the manual cut + overlay MVP. ASR remains a future provider interface so OpenAI, local whisper.cpp, faster-whisper, WhisperX, or cloud speech APIs can be added later behind one normalized result shape.

## Render variants

Aspect ratio and art direction are job-level choices, not project-wide constants. The same timeline should be able to render 16:9, 9:16, or 1:1 variants.

## Workspace and video project boundaries

A Henshusha workspace is the root opened by Claude Code, Codex, or Pi. Agent skills live at the workspace root. Individual videos or series live below `projects/<project-name>/`. Paths inside a Timeline JSON are interpreted relative to the containing video project unless they are absolute.

The starter keeps narration and ASR deferred. Future VOICEVOX-compatible adapters should remain provider-neutral and keep engine-specific speaker IDs outside canonical Timeline JSON.
