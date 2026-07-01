# Henshusha Design Notes

## Overview

Henshusha creates an agent-native video editing workspace for Claude Code, Codex, and Pi.

## Architecture

- Workspace root: opened by the agent runtime; owns shared config and installed skills.
- Video Project: one video, series, or campaign folder under `projects/<project-name>/`.
- Project-relative paths: Timeline JSON files live inside a Video Project and resolve relative paths from that folder.

## Key Decisions

- `henshusha` is the user-facing npm package for `npx henshusha` and `bunx henshusha`.
- The starter creates a multi-project workspace, not a single-video folder.
- Japanese script-first videos are a first-class early path via provider-neutral `voicevox-compatible` narration and a Zundamon preset.
- Timeline JSON stays provider-neutral; adapter-specific VOICEVOX speaker IDs belong in provider config, not canonical timeline data.

## TODO

- Add `henshusha new-project <name>` to create more folders under `projects/`.
- Add a VOICEVOX-compatible TTS adapter and timing output.
- Add a minimal Remotion template for `yukkuri-zundamon-lite`.

## Changelog

- 2026-07-01: Recorded workspace/video-project split and Zundamon/Yukkuri-style narration direction.
