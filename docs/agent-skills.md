# Agent Skills

MVP skills:

- `henshusha-analyze-source` — inspect media, extract audio, run ASR, create transcript and timeline skeleton.
- `henshusha-edit-timeline` — clean captions, split cues, add highlights, choose render variant.
- `henshusha-render` — validate timeline and render MP4.

Skills are distributed through `@henshusha/agent-kit` and copied by `create-henshu` into:

```txt
.claude/skills/
.codex/skills/
.pi/skills/
```

Codex should use skills as the primary shape. Prompts are fallback only.
