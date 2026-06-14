---
name: verify-canvas-interaction
description: >-
  Reproduce and verify canvas interaction bugs — selection, hit-testing, rotation, dragging — in the running Excalidraw app. Use when fixing or validating pointer/selection behavior, when a bug report mentions clicking/selecting/rotating shapes, when reviewing a PR whose test plan includes browser repro steps, or when a cloud agent must post CANVAS_VERIFY_RESULT on a PR.
---

# Verify Canvas Interaction

## Quick checklist (PR review / cloud agent)

Run in order — do not skip browser repro when the test plan lists it.

```
- [ ] 1. Setup: nvm use && yarn install --frozen-lockfile
- [ ] 2. Vitest: yarn test packages/utils/geometry --watch=false  (+ any PR-specific paths)
- [ ] 3. Dev server: yarn start → http://localhost:3000 (check terminals first)
- [ ] 4. Browser repro: steps below → step-01…step-09.png
- [ ] 5. GIF: ffmpeg palettegen/paletteuse → verification.gif
- [ ] 6. Upload GIF via `gh release create` (GH_TOKEN); post PR comment with release URL + checklist + <!-- CANVAS_VERIFY_RESULT:PASS|FAIL -->
- [ ] 7. Final line: CANVAS_VERIFY_RESULT=PASS or CANVAS_VERIFY_RESULT=FAIL
```

**Pass criteria:** rotated filled rect selects on center click after deselect; unrotated filled rect still selects on center click; Vitest green.

**Cloud agent contract:** final message ends with exactly `CANVAS_VERIFY_RESULT=PASS` or `CANVAS_VERIFY_RESULT=FAIL` (nothing after). PR comment body includes `<!-- CANVAS_VERIFY_RESULT:PASS -->` or `<!-- CANVAS_VERIFY_RESULT:FAIL -->`.

## Setup

```bash
nvm use          # Node 22 from .nvmrc
yarn install --frozen-lockfile   # cloud/CI
yarn start       # http://localhost:3000 — check existing terminals first
```

Viewport for automation: **2074×1167** (see `.demo/browser-repro-coords.md`).

## Programmatic verification (run first)

```bash
yarn test packages/utils/geometry --watch=false
```

Programmatic pass is **not** sufficient when the PR test plan lists browser repro — still run browser workflow.

## Browser verification workflow

Record one screenshot per step (`step-01.png` … `step-09.png`). Use browser MCP, Puppeteer, or manual interaction — follow these steps exactly; do not re-derive coordinates each run.

| Step | Action | Screenshot |
| --- | --- | --- |
| 1 | Click canvas center `(1037,584)` — dismiss welcome | step-01.png |
| 2 | `R` → drag rect `(937,524)`→`(1137,644)` | step-02.png |
| 3 | Set **Background** fill — click 2nd color swatch under Background heading (red `#ffc9c9`) | step-03.png |
| 4 | Drag **rotation handle above top edge** (computed from localStorage + canvas bounds) ~45°+ | step-04.png |
| 5 | `V` → click empty area `(300,200)` to deselect | step-05.png |
| 6 | Click computed visual center of rotated rect | step-06.png |
| 7 | `R` → second rect `(700,750)`→`(900,870)` + fill | step-07.png |
| 8 | `V` → deselect | step-08.png |
| 9 | Click computed center of second rect | step-09.png |

**Pass/fail:** read `localStorage["excalidraw-state"].selectedElementIds` after center clicks — count > 0 = pass. Do not rely on pixel diff alone.

**Gotchas:**

1. **Fill required** — default/transparent rects hit-test outline only; center-click tests need a solid background color.
2. **Rotation handle is above the shape**, not below (`transformHandles.ts`: handle sits above top edge + gap).
3. **Compute click/drag coords from scene space** — use element `x,y,width,height` from `localStorage["excalidraw"]` + canvas `getBoundingClientRect()` + `scrollX/scrollY/zoom` from `excalidraw-state`. Hardcoded viewport coords are fallbacks only.
4. **Wait ~600ms after clicks** — localStorage persistence debounces (~300ms).

Keyboard shortcuts: `V`/selection, `R`/rectangle, `D`/diamond, `O`/ellipse.

## Assemble GIF

```bash
cd /tmp/canvas-verify/screenshots   # or your --out-dir
ffmpeg -y -framerate 1 -pattern_type glob -i 'step-*.png' \
  -vf "palettegen=stats_mode=full:max_colors=256" -update 1 -frames:v 1 palette.png
ffmpeg -y -framerate 1 -pattern_type glob -i 'step-*.png' -i palette.png \
  -lavfi "[0:v][1:v]paletteuse=dither=sierra2_4a" -loop 0 verification.gif
```

Use palettegen/paletteuse — single `-vf scale=…` washes out colors. If no ffmpeg, upload ordered step PNGs via the release path below instead of a GIF.

## Post PR comment

**Never** reference `/tmp/`, `/opt/cursor/`, or other local-only paths in comments.

**Do not commit verification GIFs to the repo.**

### GIF upload (cloud agent — use this path)

**Do not use `github.com/user-attachments/assets/…` URLs.** That upload flow requires a browser session and does **not** work with `GH_TOKEN` (PAT). Do not run `gh image`, `curl uploads.github.com`, or similar — they will fail on cloud VMs.

**Upload with `GH_TOKEN`** (fine-grained PAT with Issues + Pull requests write; not the Cursor `ghs_…` integration token):

```bash
# 1. Assemble GIF (see above) → /tmp/canvas-verify/verification.gif

# 2. Upload as a temporary release asset
TAG="canvas-verify-pr<N>-$(date +%s)"
gh release create "$TAG" /tmp/canvas-verify/verification.gif \
  --repo owner/repo \
  --title "Canvas verify PR <N> (temp)" \
  --notes "Temporary verification GIF for PR #<N>. Safe to delete after merge."

# 3. Resolve embed URL
GIF_URL=$(gh release view "$TAG" --repo owner/repo --json assets -q '.assets[0].url')

# 4. Post comment — embed GIF_URL in the UI GIF section
gh pr comment <N> --repo owner/repo --body-file comment.md
```

If ffmpeg is unavailable, upload ordered `step-*.png` files on the same release and embed each URL in the PR comment.

### PR comment template

```markdown
### Summary

A 1-2 sentence summary. Include the test result (PASS or FAIL).

### Verified

- [x] `yarn test packages/utils/geometry --watch=false`
- [x] Filled rectangle rotated ~45°, deselected, center click selects
- [x] Unrotated filled rectangle center click still selects

### Notes

Any notes (e.g. env quirks, skipped steps, failure details).

### UI GIF

![Rotated rectangle center-click selection verification](https://github.com/owner/repo/releases/download/canvas-verify-pr<N>-<timestamp>/verification.gif)

<!-- CANVAS_VERIFY_RESULT:PASS -->
```

On failure, use the same structure with FAIL in Summary, explain what failed in Notes, and attach the last screenshot/GIF anyway.

## Debugging pointers

Hit-testing path: `App.getElementAtPosition` → `hitElementItself` → `getElementShape` → `packages/utils/geometry/shape.ts` (`getPolygonShape`).

Rotation bugs: rotation origin must be element **center**, not `(x,y)` top-left. Compare with `pointRotateRads` in `packages/math/`.

Repro coords reference: `.demo/browser-repro-coords.md`.
