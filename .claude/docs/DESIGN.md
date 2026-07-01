# Henshusha Design Notes

## Overview

Henshusha creates an agent-native video editing workspace for Claude Code, Codex, and Pi.

## Architecture

- Workspace root: opened by the agent runtime; owns shared config and installed skills.
- Video Project: one video, series, or campaign folder under `projects/<project-name>/`.
- Project-relative paths: Timeline JSON files live inside a Video Project and resolve relative paths from that folder.
- Manual Timeline MVP: `scripts/edit-plan.md` is the human/agent planning surface; `timelines/main.timeline.json` is the render source of truth.
- Starter scaffold: copies a ready workspace, installs Remotion dependencies by default, and initializes a Git repository with `.gitignore` / `.gitattributes` for GitHub handoff.

## Key Decisions

- `henshusha` is the user-facing npm package for `npx henshusha` and `bunx henshusha`.
- The starter creates a multi-project workspace, not a single-video folder.
- The first implementation path is manual cut + title/caption overlay, rendered with FFmpeg.
- Whisper/ASR, VOICEVOX/Zundamon, and TTS are intentionally deferred until manual timelines render reliably.
- Timeline JSON uses `video`, `title`, and `caption` tracks for the MVP.
- Remotion text template components are selected from Timeline `preset` fields so skills can create richer captions without owning React component code.
- Update notification MVP is explicit: `henshusha doctor --updates` checks npm for a newer package; full safe workspace file upgrade requires manifest/checksum design later.

## TODO

- Improve render support for source videos without audio tracks.
- Design a safe `henshusha upgrade` path with starter manifest/checksums for generated workspaces.
- Add a VOICEVOX-compatible TTS adapter and timing output later.
- Add Whisper/ASR as an optional provider later.

## Changelog

- 2026-07-02: Added Remotion text template preset strategy, scaffold auto-install/git-init, and explicit npm update check via `doctor --updates`.
- 2026-07-01: Switched MVP from narration/ASR to manual cut + overlay rendering and recorded deferred provider scope.
- 2026-07-01: Recorded workspace/video-project split and original Zundamon/Yukkuri-style future direction.
