# @henshusha/asr

Pluggable speech-to-text provider interface for Henshusha.

## Purpose

Defines a normalized `AsrProvider` contract (`transcribe` → `AsrResult` with segments and optional word timestamps) so OpenAI Whisper, local whisper.cpp, faster-whisper, WhisperX, or cloud APIs can be added behind one shape later.

## Public API

- Types: `AsrInput`, `AsrOptions`, `AsrResult`, `AsrSegment`, `AsrWord`, `AsrProvider`
- `MockAsrProvider`, `createMockAsrProvider` — deterministic stub for tests and scaffolding

## Boundaries

- Interface and mock only — no production ASR adapter ships in the MVP.
- Manual timelines do not require ASR; see [`docs/architecture.md`](../../docs/architecture.md) (“Deferred ASR provider abstraction”).
- Transcript output is not the render source of truth; future adapters map into timeline caption items separately.
- Private workspace package; not published to npm.

## Pipeline role (future)

```txt
source audio  →  @henshusha/asr provider  →  transcript segments  →  timeline caption items
```

## Contributor pointers

- Roadmap: Phase 1 “ASR provider interface” / “One ASR adapter” in [`docs/roadmap.md`](../../docs/roadmap.md)
- Timeline transcript field: [`packages/timeline`](../timeline)
