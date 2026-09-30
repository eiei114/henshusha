# Development

Henshusha should be directly contributor-ready from this repository. Monofold and Obsidian are useful for long-term product context, but they are not required to work on the tool.

## Quick start

```bash
git clone https://github.com/eiei114/henshusha.git
cd henshusha
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` — run the default local development check.
- `pnpm dev:doctor` — run typechecks across all packages (same as `pnpm dev`).
- `pnpm dev:fixture` — create `.fixtures/basic-workspace` for dogfooding generated workspace shape.
- `pnpm dev:sample-media` — generate the tiny local `input.mp4` fixture used by render smoke tests.
- `pnpm dev:verify-render` — run doctor, render, and `ffprobe` verification end-to-end.
- `pnpm typecheck` — typecheck all packages.
- `pnpm build` — build all packages that have a build script.

## Product boundary

Do not add a `henshusha --dev` primary path. `henshusha` is for users creating a video workspace. Henshusha contributors should clone this repository and use the normal development scripts.

Generated workspaces may later support upgrades with a command like `henshusha upgrade`, but that is separate from contributor setup.

## Dogfood loop

Use Node.js 20 or newer and pnpm 9.15.9 before running this fixture and render procedure.

```bash
pnpm build
pnpm dev:fixture
cd .fixtures/basic-workspace
node ../../packages/henshusha/dist/index.js validate projects/sample-video
node ../../packages/henshusha/dist/index.js validate projects/short-clip
node ../../packages/henshusha/dist/index.js render projects/sample-video --dry-run
node ../../packages/henshusha/dist/index.js remotion-props projects/sample-video
node ../../packages/henshusha/dist/index.js render projects/sample-video
ffprobe -hide_banner -show_streams projects/sample-video/renders/output.mp4
# open with claude / codex / pi when local skill copying exists
```

The two `validate` commands are the multi-project fixture check. To run only this check from a clean checkout, use:

Use Node.js 20 or newer and pnpm 9.15.9 before installing dependencies. Ensure `ffmpeg` is installed and available on `PATH`; `pnpm dev:fixture` generates the fixture input with FFmpeg.

```bash
pnpm install
pnpm build
pnpm dev:fixture -- --force
cd .fixtures/basic-workspace
node ../../packages/henshusha/dist/index.js validate projects/sample-video
# expected on POSIX: Valid timeline: projects/sample-video/timelines/main.timeline.json
node ../../packages/henshusha/dist/index.js validate projects/short-clip
# expected on POSIX: Valid timeline: projects/short-clip/timelines/main.timeline.json
```

Both commands must exit with status 0 and print the corresponding `Valid timeline:` line. Path separators follow the host platform; Windows uses backslashes. A missing `dist/index.js` may indicate that `pnpm build` was skipped or failed; `ENOENT` for a timeline path may indicate that the fixture was not regenerated with `pnpm dev:fixture -- --force`; any other validation error may indicate a malformed fixture timeline. Check the reported path and error to identify the underlying issue. The fixture is a stable sandbox for checking the expected workspace layout before publishing a starter change. The dry-run command writes `projects/sample-video/jobs/render-plan.json` without requiring FFmpeg. The Remotion props command writes `projects/sample-video/remotion/timeline-props.json`.

### 日本語の検証シナリオ（multi-project fixture）

- **検証シナリオ:** クリーン checkout で依存関係を導入し、FFmpeg を利用できる状態で、ビルド済み CLI から `sample-video` と `short-clip` の両プロジェクトを検証する（publish 設定は不要）。
- **操作手順:** リポジトリのルートで次を順に実行する。
  ```bash
  pnpm install
  pnpm build
  pnpm dev:fixture -- --force
  cd .fixtures/basic-workspace
  node ../../packages/henshusha/dist/index.js validate projects/sample-video
  node ../../packages/henshusha/dist/index.js validate projects/short-clip
  ```
- **期待結果:** 2つの `validate` がいずれも終了コード `0` で完了し、順に `Valid timeline: projects/sample-video/timelines/main.timeline.json` と `Valid timeline: projects/short-clip/timelines/main.timeline.json` を出力する。パス区切りはホスト環境に従い、Windows ではバックスラッシュを使用する。
- **検証コマンド:** 上記のコマンド列全体。ドキュメントのスクリプト記載だけを確認する場合は `pnpm test:dev-script-docs` を実行する。
- **失敗パターン:** `dist/index.js` がない場合は `pnpm build` の失敗または未実行、timeline の `ENOENT` は `pnpm dev:fixture -- --force` の未実行を確認する。それ以外の validation error は fixture の timeline 内容を確認する。`pnpm install` の失敗は Node/pnpm のバージョンと lockfile の整合性を確認する。

See [`render-verification.md`](render-verification.md) for the full FFmpeg smoke-test workflow.

Embedded init manual QA (checkbox TUI, manifest rerun): [`embedded-init-qa.md`](embedded-init-qa.md).

## Bun support

Bun is a first-class contributor path:

```bash
bun install
bun run dev
bun run dev:fixture
```

The repository keeps scripts package-manager neutral where practical. `pnpm` remains supported for lockfile and npm-publishing workflows, but new contributor scripts should also work under `bun run`.

## Publishing

`henshusha` publishes from GitHub Actions when a push to `main` contains a package version that does not already exist on npm.

Publishing uses npm Trusted Publishing (GitHub Actions OIDC), not a long-lived `NPM_TOKEN` secret. Configure npm package settings for `henshusha` with:

- Provider: GitHub Actions
- Repository: `eiei114/henshusha`
- Workflow filename: `publish-henshusha.yml`
- Allowed action: `npm publish`

The publish job uses Node 24 and `npm publish --provenance --access public` so npm Trusted Publishing runs with a compatible Node/npm pair and emits provenance automatically.

Release flow:

1. Update `packages/henshusha/package.json` version.
2. Merge to `main`.
3. CI builds with pnpm and Bun, runs scaffold smoke tests, publishes to npm via trusted publishing, verifies both `npx henshusha@<version>` and `bunx henshusha@<version>`, then pushes tag `v<version>`.

If the version already exists, CI skips publishing and tag creation instead of failing.

## Starter workspace shape

The starter creates a workspace root with `projects/sample-video/`. Keep future CLI commands aligned with this model: workspace-level commands manage shared config and skills; project-level commands operate on `projects/<project-name>/`.
