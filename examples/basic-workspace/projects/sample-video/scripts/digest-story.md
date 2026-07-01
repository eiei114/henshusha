# Digest Story

## Intent

- Audience: someone watching a quick editing demo
- Promise: show that a raw clip can become a story-driven short with Henshusha
- Target length: 10 seconds

## Beats

1. Hook — 0:00-0:02 — `headline-pop` title — "Henshusha turns raw video into a story"
2. Context — 0:02-0:04 — `karaoke-caption` caption — "Manual beats become Timeline JSON"
3. Key moment — 0:04-0:07 — `bottom-caption` caption — "FFmpeg exports the MVP cut"
4. Payoff — 0:07-0:09 — `lower-third` title — "Remotion can preview richer motion"
5. Outro — 0:09-0:10 — `quote-card` caption — "Record the demo when ready"

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

Remotion text templates live in `remotion/text-templates.tsx`. Change each timeline item's `preset` to try `headline-pop`, `bottom-caption`, `karaoke-caption`, `lower-third`, or `quote-card`.
