import type { Crop, PaintColor, PixelData, SourceImage } from "@/types";
import { calculatePaintMix } from "@/lib/color/mix";
import { sampleGrid } from "@/lib/image-processing/sample";

export function mixTargetColors(
  colors: PixelData["targetColor"][][],
  palette: PaintColor[],
): PixelData[][] {
  return colors.map((row) =>
    row.map((targetColor) => ({
      targetColor,
      mix: calculatePaintMix(targetColor, palette),
    })),
  );
}

export function remixPixels(
  pixels: PixelData[][],
  palette: PaintColor[],
): PixelData[][] {
  return pixels.map((row) =>
    row.map((pixel) => ({
      targetColor: pixel.targetColor,
      mix: calculatePaintMix(pixel.targetColor, palette),
    })),
  );
}

export function buildPixelMatrix(
  source: SourceImage,
  crop: Crop,
  width: number,
  height: number,
  palette: PaintColor[],
): PixelData[][] {
  const colors = sampleGrid(source, crop, width, height);
  return mixTargetColors(colors, palette);
}
