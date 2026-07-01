# Sample digest edit plan

Goal: Turn `sources/raw/input.mp4` into a 10-second story-driven digest that demonstrates Henshusha's current FFmpeg + Remotion workflow.

## Source

- Put the source video at `sources/raw/input.mp4`.
- Keep raw media unchanged.

## Story beats

1. Hook: `素材からストーリーへ` — use source 0:00-0:02.
2. Context: `ビートを手で決める` — use source 0:02-0:04.
3. Key moment: `Timeline JSON が編集の正本` — use source 0:04-0:07.
4. Payoff: `FFmpegでMVPを書き出し` — use source 0:07-0:09.
5. Outro: `Remotionで次の表現へ` — use source 0:09-0:10.

## Timeline mapping

- 0:00-0:02: source 0:00-0:02, center title `素材からストーリーへ`
- 0:02-0:04: source 0:02-0:04, bottom caption `ビートを手で決める`
- 0:04-0:07: source 0:04-0:07, bottom caption `Timeline JSON が編集の正本`
- 0:07-0:09: source 0:07-0:09, center title `FFmpegでMVPを書き出し`
- 0:09-0:10: source 0:09-0:10, bottom caption `Remotionで次の表現へ`

## Output

- FFmpeg MVP render: `renders/output.mp4`
- Optional Remotion render: `renders/remotion-output.mp4`
- Default format: 9:16, 1080x1920.
