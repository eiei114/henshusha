# Basic example

This folder documents the smallest copy-and-run Henshusha workspace example.

The runnable workspace lives in [`../basic-workspace/`](../basic-workspace/). It matches the starter that `npx henshusha@latest my-studio` scaffolds, checked into the repo for contributors and docs.

## Copy and run

macOS / Linux:

```bash
cp -r examples/basic-workspace /path/to/my-studio
cd /path/to/my-studio
npm install
```

Windows (PowerShell):

```powershell
Copy-Item -Recurse examples/basic-workspace C:\path\to\my-studio
cd C:\path\to\my-studio
npm install
```

Put source media at `projects/sample-video/sources/raw/input.mp4`, then run the MVP path from the workspace root:

```bash
npm run validate
npm run render:dry-run
npm run remotion:props
npm run render
```

Check for package updates:

```bash
npm run doctor:updates
```

See [`../basic-workspace/README.md`](../basic-workspace/README.md) for the full workspace layout, Remotion preview commands, and text-template presets.

## From this repository

Contributors can dogfood the same shape without copying:

```bash
pnpm dev:fixture
cd .fixtures/basic-workspace
node ../../packages/henshusha/dist/index.js validate projects/sample-video
```
