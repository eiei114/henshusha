# @henshusha/remotion

**Status:** interface/stub — not yet published.

Remotion integration layer for Henshusha.

## Purpose

Will connect validated Timeline JSON to Remotion compositions for richer preview and render than the FFmpeg overlay path alone.

## Public API

Stub only today: `packageName` export. Generated workspaces ship a Remotion starter under `projects/<name>/remotion/` via the [`henshusha`](../henshusha) scaffolder template (`remotion:preview`, `remotion:render` scripts).

## Boundaries

- Remotion bridge code only — shared caption/layout primitives belong in [`@henshusha/components`](../components); starter compositions belong in [`@henshusha/templates`](../templates).
- The MVP manual renderer does not require Remotion; FFmpeg cut + overlay remains the first path.
- Private workspace package; not published to npm.

## Current integration boundary

`@henshusha/remotion` is a future shared bridge, not part of the live generated-workspace render path. Generated workspaces currently use the scaffolder's Remotion starter directly:

```txt
Timeline JSON
  → henshusha remotion-props
  → projects/<name>/remotion/timeline-props.json
  → @remotion/cli (workspace dependency)
  → preview / MP4
```

The `timeline-props.json` file is regenerated from Timeline JSON and is not a second editing source of truth. Shared bridge code may move into this package later without changing that boundary.

## Verification

From the root of a generated workspace, run the live integration smoke command:

```bash
npm run remotion:render
```

This regenerates the props file and writes `projects/sample-video/renders/remotion-output.mp4`. To inspect the resulting container as a second check:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 projects/sample-video/renders/remotion-output.mp4
```

## レビュー用検証シナリオ

対象は、生成ワークスペースの Remotion starter が現在の実行経路であり、`@henshusha/remotion` は未公開の将来境界であることです。手動確認は不要です。以下のコマンドで自動的に確認できます。

### 操作手順と期待結果

リポジトリルートで次を実行します。

```bash
pnpm typecheck
pnpm test:dev-script-docs
pnpm test:ci-docs
pnpm test:version-policy-docs
pnpm test:examples
pnpm test:timeline-schema
pnpm test:henshusha
git diff --check
```

- `pnpm typecheck`: 型チェックが終了コード 0 になること。
- `pnpm test:dev-script-docs`、`pnpm test:ci-docs`、`pnpm test:version-policy-docs`: 各ドキュメント回帰チェックが成功すること。
- `pnpm test:examples`: ビルドとサンプル検証が成功すること。
- `pnpm test:timeline-schema`: Timeline スキーマ検証が成功すること。
- `pnpm test:henshusha`: CLI ビルド、エントリポイント、初期化検証が成功すること。
- `git diff --check`: 空白エラーが報告されないこと。

Remotion の実行経路を確認する場合は、生成ワークスペースのルートで `npm run remotion:render` を実行し、`projects/sample-video/renders/remotion-output.mp4` が生成された後、上記の `ffprobe` コマンドがコンテナの duration を出力することを確認します。

### 失敗パターン

- `pnpm` の検証が失敗した場合は、Node.js 20 以上・依存関係のインストール・リポジトリルートからの実行を確認します。
- `npm run remotion:render` が失敗した場合は、生成ワークスペース内で実行しているか、`remotion-props` が props を再生成できているか、`@remotion/cli` が利用可能かを確認します。
- `ffprobe` が失敗した場合は、`ffmpeg` / `ffprobe` が PATH 上にあり、出力 MP4 が存在するかを確認します。
- `@henshusha/remotion` を生成ワークスペースの実行時依存と誤認しないでください。現行経路は starter から `@remotion/cli` を呼び出します。

## Planned package role

```txt
Timeline JSON  →  remotion props  →  @henshusha/remotion (future shared bridge)
```

## Contributor pointers

- Full integration boundary: [`docs/remotion.md`](../../docs/remotion.md)
- Text overlay presets in generated workspaces: see [`packages/henshusha/README.md`](../henshusha/README.md) (Remotion starter section)
- Roadmap: Phase 1 “One Remotion template” in [`docs/roadmap.md`](../../docs/roadmap.md)
