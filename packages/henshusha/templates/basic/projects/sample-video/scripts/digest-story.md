# Digest Story

## Intent

- Audience: someone watching a quick editing demo
- Promise: show that a raw clip can become a story-driven short with Henshusha
- Target length: 10 seconds

## Beats

1. Hook — 0:00-0:02 — title overlay — "Henshusha turns raw video into a story"
2. Context — 0:02-0:04 — caption overlay — "Manual beats become Timeline JSON"
3. Key moment — 0:04-0:07 — caption overlay — "FFmpeg exports the MVP cut"
4. Payoff — 0:07-0:09 — title overlay — "Remotion can preview richer motion"
5. Outro — 0:09-0:10 — caption overlay — "Record the demo when ready"

## Source ranges

- `sources/raw/input.mp4` 00:00:00-00:00:02 -> Hook
- `sources/raw/input.mp4` 00:00:02-00:00:04 -> Context
- `sources/raw/input.mp4` 00:00:04-00:00:07 -> Key moment
- `sources/raw/input.mp4` 00:00:07-00:00:09 -> Payoff
- `sources/raw/input.mp4` 00:00:09-00:00:10 -> Outro

## Render paths

```bash
npx henshusha validate projects/sample-video
npx henshusha render projects/sample-video --dry-run
npx henshusha remotion-props projects/sample-video
npx henshusha render projects/sample-video
npm run remotion:preview
```
