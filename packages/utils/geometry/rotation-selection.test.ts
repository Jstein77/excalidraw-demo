import type { Radians } from "@excalidraw/math";
import { pointFrom } from "@excalidraw/math";
import { isPointInShape } from "../collision";
import { getPolygonShape } from "./shape";
import type { ExcalidrawRectangleElement } from "@excalidraw/excalidraw/element/types";

/** Minimal rectangle — getPolygonShape only reads x, y, width, height, angle, type */
const makeRectangle = (
  overrides: Partial<ExcalidrawRectangleElement> = {},
): ExcalidrawRectangleElement =>
  ({
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 120,
    angle: 0 as Radians,
    ...overrides,
  } as ExcalidrawRectangleElement);

describe("getPolygonShape rotation selection", () => {
  it("includes element center for a rotated rectangle", () => {
    const rectangle = makeRectangle({
      angle: (Math.PI / 4) as Radians, // ~45°, same as manual repro
    });

    const shape = getPolygonShape(rectangle);
    const center = pointFrom(
      rectangle.x + rectangle.width / 2,
      rectangle.y + rectangle.height / 2,
    );

    expect(isPointInShape(center, shape)).toBe(true);
  });

  it("still includes element center when unrotated", () => {
    const rectangle = makeRectangle({ angle: 0 as Radians });

    const shape = getPolygonShape(rectangle);
    const center = pointFrom(
      rectangle.x + rectangle.width / 2,
      rectangle.y + rectangle.height / 2,
    );

    expect(isPointInShape(center, shape)).toBe(true);
  });

  it("excludes a point clearly outside the shape", () => {
    const rectangle = makeRectangle({
      angle: (Math.PI / 4) as Radians,
    });

    const shape = getPolygonShape(rectangle);
    const outside = pointFrom(rectangle.x - 50, rectangle.y - 50);

    expect(isPointInShape(outside, shape)).toBe(false);
  });
});