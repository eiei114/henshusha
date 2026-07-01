# Agent skills

Bundled Henshusha skills are copied into `.claude/skills`, `.codex/skills`, and `.pi/skills` in generated workspaces.

- `henshusha-analyze-source` — inspect the target video project and shape rough user intent into `scripts/edit-plan.md`.
- `henshusha-edit-timeline` — convert the edit plan into `timelines/main.timeline.json` with video/title/caption tracks.
- `henshusha-render` — validate and render the manual timeline with FFmpeg.

MVP rule: do not require Whisper/ASR, TTS, or VOICEVOX. Those providers can be added later, but manual timelines must work first.
