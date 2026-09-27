import { describe, expect, it } from "vitest";
import { calculatePaintMix, mixPercents } from "@/lib/color/mix";
import { DEFAULT_PALETTE } from "@/lib/color/palette";
import { hexToRgb } from "@/lib/color/convert";

describe("calculatePaintMix", () => {
  it("assigns 100% to an exact palette color", () => {
    const target = hexToRgb("#00FFFF");
    expect(target).not.toBeNull();
    if (!target) {
      return;
    }
    const mix = calculatePaintMix(target, DEFAULT_PALETTE);
    expect(mix.weights.cyan).toBe(1);
    expect(mix.weights.magenta).toBe(0);
    const percents = mixPercents(mix, DEFAULT_PALETTE);
    const total = percents.reduce((sum, item) => sum + item.percent, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it("includes every palette color in the mix", () => {
    const target = hexToRgb("#D89050");
    expect(target).not.toBeNull();
    if (!target) {
      return;
    }
    const mix = calculatePaintMix(target, DEFAULT_PALETTE);
    for (const paint of DEFAULT_PALETTE) {
      expect(mix.weights[paint.id]).toBeTypeOf("number");
    }
    const sum = Object.values(mix.weights).reduce((total, value) => total + value, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("approximates gray with black and white", () => {
    const palette = DEFAULT_PALETTE.filter(
      (paint) => paint.id === "black" || paint.id === "white",
    );
    const target = hexToRgb("#808080");
    expect(target).not.toBeNull();
    if (!target) {
      return;
    }
    const mix = calculatePaintMix(target, palette);
    expect(mix.weights.black ?? 0).toBeGreaterThan(0.2);
    expect(mix.weights.white ?? 0).toBeGreaterThan(0.2);
  });
});
