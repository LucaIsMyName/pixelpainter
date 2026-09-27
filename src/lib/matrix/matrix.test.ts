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

  it("writes mix keys from the user-facing paint names", () => {
    const palette = [
      { id: "cyan", name: "Blue", hex: "#0006FF" },
      { id: "95d1e1c5-fd3a-4b64-b840-c263fd3c8e52", name: "Orange", hex: "#FF8802" },
    ];
    const targetColor = { r: 144, g: 135, b: 130 };
    const pixel = {
      targetColor,
      mix: calculatePaintMix(targetColor, palette),
    };
    const row = [pixel, pixel, pixel, pixel];
    const pixels = [row, row, row, row];
    const text = serializeMatrix(4, 4, palette, pixels);
    const parsedJson = JSON.parse(text) as {
      palette: Array<{ id: string; name: string }>;
      pixels: Array<Array<{ mix: Record<string, number> }>>;
    };
    expect(parsedJson.palette.map((paint) => paint.id)).toEqual(["Blue", "Orange"]);
    expect(parsedJson.pixels[0]?.[0]?.mix).toHaveProperty("Blue");
    expect(parsedJson.pixels[0]?.[0]?.mix).toHaveProperty("Orange");
    expect(parsedJson.pixels[0]?.[0]?.mix).not.toHaveProperty("cyan");
    expect(parsedJson.pixels[0]?.[0]?.mix).not.toHaveProperty(
      "95d1e1c5-fd3a-4b64-b840-c263fd3c8e52",
    );

    const parsed = parseMatrix(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.palette[0]?.name).toBe("Blue");
    expect(parsed.value.pixels[0]?.[0]?.mix.weights.Blue).toBeTypeOf("number");
  });

  it("still reads older matrix files that keyed mixes by id", () => {
    const result = parseMatrix(
      JSON.stringify({
        format: "pixelpainter",
        version: 1,
        width: 4,
        height: 4,
        palette: [
          { id: "cyan", name: "Blue", hex: "#0006FF" },
          { id: "black", name: "Black", hex: "#000000" },
        ],
        algorithm: "rgb-linear-nnls",
        pixels: Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => ({
            hex: "#808080",
            mix: { cyan: 0.4, black: 0.6 },
          })),
        ),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.pixels[0]?.[0]?.targetColor).toEqual({
      r: 128,
      g: 128,
      b: 128,
    });
    expect(result.value.pixels[0]?.[0]?.mix.algorithm).toBe("rgb-absorb-nnls");
    expect(result.value.pixels[0]?.[0]?.mix.weights.cyan).toBeTypeOf("number");
    expect(result.value.pixels[0]?.[0]?.mix.weights.black).toBeTypeOf("number");
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
