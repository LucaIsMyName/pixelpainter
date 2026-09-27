import { describe, expect, it } from "vitest";
import { largestCenteredCrop } from "@/lib/image-processing/crop";

describe("largestCenteredCrop", () => {
  it("fits a 3:4 frame inside a wide image", () => {
    const crop = largestCenteredCrop(1920, 1080, 30 / 40);
    expect(crop.height).toBeCloseTo(1080);
    expect(crop.width).toBeCloseTo(1080 * 0.75);
    expect(crop.x).toBeCloseTo((1920 - crop.width) / 2);
    expect(crop.y).toBeCloseTo(0);
  });
});
