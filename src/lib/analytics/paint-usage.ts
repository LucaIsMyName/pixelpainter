import type { PaintColor, PixelData } from "@/types";
import { mixPercents } from "@/lib/color";

export type PaintUsageRow = {
  paint: PaintColor;
  averagePercent: number;
  cellCount: number;
};

export function summarizePaintUsage(
  pixels: PixelData[][],
  palette: PaintColor[],
): PaintUsageRow[] {
  const totals = new Map<string, { sum: number; cells: number }>();
  for (const paint of palette) {
    totals.set(paint.id, { sum: 0, cells: 0 });
  }

  for (const row of pixels) {
    for (const pixel of row) {
      const percents = mixPercents(pixel.mix, palette);
      for (const entry of percents) {
        if (entry.percent <= 0.05) {
          continue;
        }
        const bucket = totals.get(entry.paint.id);
        if (bucket) {
          bucket.sum += entry.percent;
          bucket.cells += 1;
        }
      }
    }
  }

  const cellTotal = pixels.length * (pixels[0]?.length ?? 0);
  return palette
    .map((paint) => {
      const bucket = totals.get(paint.id) ?? { sum: 0, cells: 0 };
      return {
        paint,
        averagePercent: cellTotal > 0 ? bucket.sum / cellTotal : 0,
        cellCount: bucket.cells,
      };
    })
    .sort((a, b) => b.averagePercent - a.averagePercent);
}
