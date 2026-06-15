import type { Radians } from "@excalidraw/math";
import { pointFrom, polygonIncludesPoint } from "@excalidraw/math";
import type { ExcalidrawRectangleElement } from "@excalidraw/excalidraw/element/types";
import { getPolygonShape } from "./shape";

const makeRectangle = (
  overrides: Partial<ExcalidrawRectangleElement> = {},
): ExcalidrawRectangleElement =>
  ({
    type: "rectangle",
    x: 100,
    y: 100,
    width: 100,
    height: 50,
    angle: 0 as Radians,
    ...overrides,
  } as ExcalidrawRectangleElement);

describe("getPolygonShape", () => {
  it("includes rectangle center for unrotated and rotated rectanguloids", () => {
    const unrotated = getPolygonShape(makeRectangle());
    expect(unrotated.type).toBe("polygon");
    if (unrotated.type !== "polygon") {
      return;
    }
    expect(polygonIncludesPoint(pointFrom(150, 125), unrotated.data)).toBe(
      true,
    );

    const rotated = getPolygonShape(
      makeRectangle({ angle: (Math.PI / 4) as Radians }),
    );
    expect(rotated.type).toBe("polygon");
    if (rotated.type !== "polygon") {
      return;
    }
    expect(polygonIncludesPoint(pointFrom(150, 125), rotated.data)).toBe(true);
    expect(polygonIncludesPoint(pointFrom(0, 0), rotated.data)).toBe(false);
  });
});
