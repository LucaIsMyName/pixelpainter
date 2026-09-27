import { describe, expect, it } from "vitest";
import { calculatePaintMix } from "@/lib/color/mix";
import { DEFAULT_PALETTE } from "@/lib/color/palette";
import { parseMatrix, serializeMatrix } from "@/lib/matrix";

describe("matrix serialization", () => {
  it("round-trips a generated matrix", () => {
    const palette = DEFAULT_PALETTE;
    const row = Array.from({ length: 4 }, (_, x) => {
      const targetColor = { r: 40 + x * 20, g: 80, b: 120 };
      return {
        targetColor,
        mix: calculatePaintMix(targetColor, palette),
      };
    });
    const pixels = Array.from({ length: 4 }, () => row.map((pixel) => ({ ...pixel, mix: { ...pixel.mix, weights: { ...pixel.mix.weights } } })));
    const text = serializeMatrix(4, 4, palette, pixels);
    const parsed = parseMatrix(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.width).toBe(4);
    expect(parsed.value.height).toBe(4);
    expect(parsed.value.pixels[0]?.[0]?.targetColor).toEqual({
      r: 40,
      g: 80,
      b: 120,
    });
  });

  it("rejects an unknown format", () => {
    const result = parseMatrix(JSON.stringify({ format: "other", version: 1 }));
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported version", () => {
    const result = parseMatrix(
      JSON.stringify({
        format: "pixelpainter",
        version: 99,
        width: 4,
        height: 4,
        palette: DEFAULT_PALETTE,
        pixels: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toContain("v99");
  });

  it("rejects invalid JSON", () => {
    const result = parseMatrix("{not json");
    expect(result.ok).toBe(false);
  });
});
