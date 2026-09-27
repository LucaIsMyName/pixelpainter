import { describe, expect, it } from "vitest";
import { clonePalette, DEFAULT_PALETTE } from "@/lib/color";
import { createPaintMix, hexToRgb } from "@/lib/color";
import type { PixelData } from "@/types";
import {
  buildSessionSnapshot,
  parseSessionForRestore,
  parseSessionSnapshot,
} from "@/lib/persistence/session-snapshot";

function samplePixels(size: number): PixelData[][] {
  const color = hexToRgb("#ff0000");
  if (!color) {
    throw new Error("bad hex");
  }
  const palette = clonePalette(DEFAULT_PALETTE);
  const mix = createPaintMix(palette, { [palette[0]!.id]: 1 });
  const cell: PixelData = { targetColor: color, mix };
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => cell),
  );
}

describe("session snapshot", () => {
  it("round-trips crop phase without matrix", () => {
    const snapshot = buildSessionSnapshot(
      {
        phase: "crop",
        width: 30,
        height: 40,
        crop: { x: 10, y: 20, width: 100, height: 133 },
        palette: clonePalette(DEFAULT_PALETTE),
        pixels: [],
        selectedPixel: null,
        source: { fileName: "photo.jpg", mimeType: "image/jpeg" },
      },
      true,
    );
    expect(snapshot).not.toBeNull();
    const raw = JSON.stringify(snapshot);
    const parsed = parseSessionSnapshot(raw);
    expect(parsed?.phase).toBe("crop");
    const restore = parseSessionForRestore(parsed!);
    expect("error" in restore).toBe(false);
    if (!("error" in restore)) {
      expect(restore.pixels).toHaveLength(0);
      expect(restore.crop?.width).toBe(100);
    }
  });

  it("round-trips editor with pixels via matrix json", () => {
    const palette = clonePalette(DEFAULT_PALETTE);
    const pixels = samplePixels(4);
    const snapshot = buildSessionSnapshot(
      {
        phase: "editor",
        width: 4,
        height: 4,
        crop: null,
        palette,
        pixels,
        selectedPixel: { x: 0, y: 0 },
        source: null,
      },
      false,
    );
    expect(snapshot?.matrixJson).toContain("pixelpainter");
    const restore = parseSessionForRestore(snapshot!);
    expect("error" in restore).toBe(false);
    if (!("error" in restore)) {
      expect(restore.pixels).toHaveLength(4);
      expect(restore.selectedPixel).toEqual({ x: 0, y: 0 });
    }
  });

  it("returns null for start phase", () => {
    expect(
      buildSessionSnapshot(
        {
          phase: "start",
          width: 30,
          height: 40,
          crop: null,
          palette: clonePalette(DEFAULT_PALETTE),
          pixels: [],
          selectedPixel: null,
          source: null,
        },
        false,
      ),
    ).toBeNull();
  });
});
