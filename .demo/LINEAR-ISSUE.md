# Linear issue — paste or create via Linear MCP

Use this content when creating the demo ticket (Linear MCP: `create_issue` or equivalent after OAuth).

---

**Title:** Rotated rectangles fail to select on click

**Priority:** High

**Labels:** bug, canvas, hit-testing

**Description:**

## Summary

Users report that rectangles rotated away from 0° cannot be selected by clicking on the shape body. Unrotated rectangles work normally.

## Environment

- App: Excalidraw local dev (`yarn start` → http://localhost:3000)
- Browser: Chrome (latest)
- Repo: `Jstein77/excalidraw-demo` @ `main`

## Steps to reproduce

1. Open http://localhost:3000
2. Select the **Rectangle** tool (press `R`)
3. Draw a rectangle on the canvas
4. Select the shape and rotate it ~45° using the rotation handle (or press `Shift+R` and drag)
5. Switch to the **Selection** tool (`V`)
6. Click the center of the rotated rectangle

## Expected

The rectangle is selected; selection handles appear aligned with the rotated shape.

## Actual

Click does not select the shape. User must marquee-select or click near the unrotated axis-aligned bounding box edge.

## Notes

Likely related to hit-test polygon vs visual rotation. Inspect `getPolygonShape()` in `packages/utils/geometry/shape.ts` — suspect wrong rotation pivot for rectanguloid elements (origin vs center). See also `packages/excalidraw/shapes.tsx`.

## Acceptance criteria

- [ ] Rotated filled rectangles select on click anywhere inside the visible shape
- [ ] Unrotated rectangles still select correctly
- [ ] Vitest regression test added under `packages/utils/geometry/`
