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
- [ ] 6. PR comment: inline GIF + verified checklist + <!-- CANVAS_VERIFY_RESULT:PASS|FAIL -->
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

Use palettegen/paletteuse — single `-vf scale=…` washes out colors. If no ffmpeg, attach ordered step PNGs individually.

## Post PR comment

**Never** reference `/tmp/`, `/opt/cursor/`, or other local-only paths in comments.

**Do not commit verification GIFs to the repo.**

### GIF upload (inline display)

1. **Preferred:** GitHub user attachment URL (`github.com/user-attachments/assets/…`) — requires `GH_TOKEN` fine-grained PAT with Issues + Pull requests write (not the Cursor `ghs_…` integration token). Upload via browser session or `gh extension install drogers0/gh-image`.
2. **Fallback:** temporary release asset on the same repo (`gh release create … verification.gif`) — embed the `releases/download/…/verification.gif` URL.
3. **Last resort:** attach ordered step PNGs individually (same release or user-attachments).

```bash
GH_TOKEN="$PAT" gh pr comment <N> --repo owner/repo --body-file comment.md
```

### PR comment template

```markdown
Browser verification passed.

![Rotated rectangle center-click selection verification](https://github.com/user-attachments/assets/{asset-id})

<!-- CANVAS_VERIFY_RESULT:PASS -->

Verified:

- [x] `yarn test packages/utils/geometry --watch=false`
- [x] Filled rectangle rotated ~45°, deselected, center click selects
- [x] Unrotated filled rectangle center click still selects
```

On failure, post the same template with `FAIL`, explain which step failed, and attach the last screenshot/GIF anyway.

## Debugging pointers

Hit-testing path: `App.getElementAtPosition` → `hitElementItself` → `getElementShape` → `packages/utils/geometry/shape.ts` (`getPolygonShape`).

Rotation bugs: rotation origin must be element **center**, not `(x,y)` top-left. Compare with `pointRotateRads` in `packages/math/`.

Repro coords reference: `.demo/browser-repro-coords.md`.
