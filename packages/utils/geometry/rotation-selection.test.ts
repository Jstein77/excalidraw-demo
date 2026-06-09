import { describe, expect, it } from "vitest";
import { pointFrom } from "@excalidraw/math";
import { getPolygonShape } from "./shape";
import { isPointInShape } from "@excalidraw/utils/collision";

describe("rotated rectangle hit testing", () => {
  it("selects when clicking the visual center of a 45° rotated rectangle", () => {
    const rectangle = {
      type: "rectangle" as const,
      id: "test-rect",
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      angle: (Math.PI / 4) as import("@excalidraw/math").Radians,
      strokeColor: "#000",
      backgroundColor: "#ffc9c9",
      fillStyle: "solid" as const,
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      seed: 1,
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      groupIds: [] as string[],
      frameId: null,
      boundElements: null,
      updated: 1,
      link: null,
      locked: false,
      roundness: null,
    };

    const shape = getPolygonShape(rectangle);
    const center = pointFrom(
      rectangle.x + rectangle.width / 2,
      rectangle.y + rectangle.height / 2,
    );

    expect(isPointInShape(center, shape)).toBe(true);
  });
});
