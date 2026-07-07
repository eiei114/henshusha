# Embedded init manual QA

Manual checks for the interactive `henshusha init` checkbox TUI and rerun preselection. Automated coverage lives in `pnpm test:henshusha`.

## 確認シナリオ

TTY 上で `henshusha init` を初回実行したときにチェックボックス TUI が表示され、Space でトグル・Enter で確定できること。再実行時は `.henshusha/manifest.json` の選択が事前チェックされること。

## 操作手順

1. 空の Git リポジトリを用意する（`git init qa-embedded-init && cd qa-embedded-init`）。
2. ターミナルで `node /path/to/henshusha/dist/index.js init --no-install` を実行する（`npx` でも可）。
3. プロンプトで Claude Code / Codex / Pi が表示されることを確認する。
4. Space で Pi のみオフにし、Enter で確定する。
5. `.pi/skills/henshusha-render/SKILL.md` が無いこと、`.claude` / `.codex` 側にスキルがあることを確認する。
6. 同じコマンドを再実行し、前回の選択（Pi オフ）が事前チェックされていることを確認する。
7. Enter で確定後、既存の Claude/Codex スキルが削除されていないことを確認する。

## 期待結果

- 初回は全ランタイムがデフォルト選択される。
- Space でトグル、Enter で確定できる。
- `.henshusha/manifest.json` に `selectedAgents` とインストール済みスキルのハッシュが記録される。
- 再実行時は manifest の選択が事前反映される。
- オフにしたランタイムの既存スキルは削除されない。

## 確認コマンド

```bash
pnpm build
node packages/henshusha/dist/index.js init --no-install   # TTY で手動確認
cat .henshusha/manifest.json
pnpm test:henshusha
```

## 注意する失敗パターン

- CI やパイプ入力では TUI は出ず、`--all-agents` 相当の非対話挙動になる（ハングしないこと）。
- `--agents` / `--all-agents` / `--no-skills` を同時指定するとエラーになる。
- 既存スキルと内容が衝突するとデフォルトで失敗し、`--force` で上書きできる。
