# Browser repro coordinates (localhost:3000, ~2074×1167 canvas)

Measured from IDE browser automation session. Adjust if viewport differs.

## Setup
```bash
nvm use          # Node 22 from .nvmrc
yarn install
YARN_IGNORE_ENGINES=1 yarn start   # or yarn start on Node 22
```

## Manual repro (recommended live)
1. Open http://localhost:3000 — click canvas to dismiss welcome screen
2. Press `R` → draw rectangle (~200×120) center of canvas
3. Select shape → drag rotation handle to ~45°
4. Press `V` → click center of rotated rectangle
5. **Bug:** no selection handles. **Fixed:** shape selects.

## Agent browser automation prompt
```
Open http://localhost:3000. Dismiss welcome by clicking canvas center.
Press R, drag rectangle from (937,524) to (1137,644) on viewport.
Select the shape, rotate ~45° using rotation handle.
Press V, click center (1037,584). Screenshot whether selection handles appear.
```

## Programmatic repro (fast, no UI)
On demo-start branch the regression test file does NOT exist yet — agent should add it during fix.
After fix: `yarn test packages/utils/geometry/rotation-selection.test.ts --watch=false`

Root cause file: `packages/utils/geometry/shape.ts` → `getPolygonShape()` uses wrong `rotationOrigin` (top-left instead of center).
