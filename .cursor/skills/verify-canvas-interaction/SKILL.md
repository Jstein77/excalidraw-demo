---
name: verify-canvas-interaction
description: >-
  Reproduce and verify canvas interaction bugs — selection, hit-testing, rotation, dragging — in the running Excalidraw app. Use when fixing or validating pointer/selection behavior, when a bug report mentions clicking/selecting/rotating shapes, or when reviewing a PR whose test plan includes browser repro steps for canvas interaction.
---

# Verify Canvas Interaction

Workflow for reproducing and verifying canvas selection/hit-testing bugs, both in the browser and with targeted tests.

## Setup

Before starting a dev server, check existing terminals — one may already be running.

```bash
nvm use          # Node 22 from .nvmrc
yarn install     # use --frozen-lockfile in cloud/CI environments
yarn start       # http://localhost:3000
```

## Keyboard shortcuts (tool selection)

| Key        | Tool      |
| ---------- | --------- |
| `V` or `1` | Selection |
| `R` or `2` | Rectangle |
| `D` or `3` | Diamond   |
| `O` or `4` | Ellipse   |
| `A` or `5` | Arrow     |
| `L` or `6` | Line      |

## Browser verification workflow

Record the test as a sequence of screenshots — one after each step below — so the full interaction is documented, not just the end state.

1. Open http://localhost:3000 and click the canvas center to dismiss the welcome screen.
2. Press `R`, then drag to draw a rectangle (~200×120) near the canvas center.
3. Set a **fill/background color** on the rectangle — transparent/default rectangles hit-test by outline only, so center-click selection tests require a fill.
4. The shape is selected after drawing — drag the rotation handle (below the shape) to rotate it ~45°.
5. Press `V`, click an empty area to deselect, then click the center of the rotated shape.
6. Capture the final frame. **Pass:** selection handles appear around the shape. **Fail:** no selection.
7. Also verify the unrotated case: draw a second rectangle (with fill), deselect, click its center — it must still select.

Repeat with the relevant shape/rotation from the bug report if it differs.

### Assemble the recording

Combine the step screenshots into a single recording (GIF or MP4) and attach it to the PR or bug report:

```bash
# screenshots named step-01.png, step-02.png, ... in order
ffmpeg -framerate 1 -pattern_type glob -i 'step-*.png' -vf "scale=1280:-2" verification.mp4
# or a GIF:
ffmpeg -framerate 1 -pattern_type glob -i 'step-*.png' -vf "scale=960:-2" verification.gif
```

If `ffmpeg` is unavailable, attach the ordered screenshots individually instead.

## Programmatic verification (run first)

Faster than the browser; run first when a regression test covers the behavior:

```bash
yarn test packages/utils/geometry --watch=false
```

When the PR test plan lists browser repro steps, programmatic tests passing is **not** sufficient — still run the browser workflow below. Do not leave a "residual note" about skipping browser verification.

## PR review workflow (mandatory when test plan has browser steps)

When reviewing a PR (e.g. `@cursoragent review this pr`) whose test plan includes canvas browser repro items, run this full sequence without deferring steps:

1. **Setup** — `nvm use`, `yarn install --frozen-lockfile` (cloud environments often start without node_modules)
2. **Static validation** — ESLint changed files with `--max-warnings=0`; run Vitest commands from the PR test plan
3. **Browser repro** — start dev server if needed; run the browser verification workflow above in headless Chrome; **do not skip or defer this step**
4. **Recording** — capture step screenshots and assemble a GIF via the ffmpeg commands above
5. **Publish artifact** — commit the GIF to `.demo/<descriptive-name>.gif` on the PR branch (`docs:` prefix commit)
6. **Post PR comment** — include the repo-backed GIF URL and verified checklist bullets (see below)

Fix any issues found (lint, tests, repro failures) before posting the review comment.

## Posting verification artifacts to PR comments

**Never** reference `/opt/cursor/`, `/tmp/`, or other local-only paths in PR comments — GitHub cannot render them.

**GIF (preferred for inline display):** commit to `.demo/`, then post:

```markdown
![Rotated rectangle selection](https://raw.githubusercontent.com/{owner}/{repo}/{commit}/.demo/{name}.gif)
```

Verify the URL returns HTTP 200 before commenting.

**MP4:** may be committed to `.demo/` as supplementary evidence, but raw GitHub URLs serve as `application/octet-stream` and **will not inline** in PR comments. Do not claim inline video unless using a `github.com/user-attachments/assets/...` URL (agents cannot create these via `gh` token — tell the user to drag/drop the file into the comment box if they need inline video). Prefer GIF for PR comments.

**PR comment template:**

```markdown
Browser verification passed.

![{description}](https://raw.githubusercontent.com/{owner}/{repo}/{commit}/.demo/{name}.gif)

Verified:

- [ ] {test plan item 1}
- [ ] {test plan item 2}
```

## Debugging pointers

Hit-testing trace path for selection bugs:

`App.getElementAtPosition` → `hitElementItself` → `getElementShape` (`packages/excalidraw/shapes.tsx`) → shape builders in `packages/utils/geometry/shape.ts` (e.g. `getPolygonShape`).

For rotation issues, check that the rotation origin used by the shape builder is the element center, and compare with `pointRotateRads` usage in `packages/math/`.
