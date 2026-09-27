import type { PixelData } from "@/types";
import { rgbToHex } from "@/lib/color";
import { JPG_PIXEL_SCALE, JPG_QUALITY } from "@/lib/image-processing/dimensions";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function renderPixelsToCanvas(
  pixels: PixelData[][],
  scale: number = JPG_PIXEL_SCALE,
): HTMLCanvasElement {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create an export canvas.");
  }
  context.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 1) {
    const row = pixels[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < width; x += 1) {
      const pixel = row[x];
      if (!pixel) {
        continue;
      }
      context.fillStyle = rgbToHex(pixel.targetColor);
      context.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

export async function pixelsToJpegBlob(
  pixels: PixelData[][],
  scale: number = JPG_PIXEL_SCALE,
  quality: number = JPG_QUALITY,
): Promise<Blob> {
  const canvas = renderPixelsToCanvas(pixels, scale);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Could not create a JPG file.");
  }
  return blob;
}

export async function downloadPixelJpeg(
  pixels: PixelData[][],
  width: number,
  height: number,
): Promise<void> {
  const blob = await pixelsToJpegBlob(pixels);
  downloadBlob(blob, `pixelpainter-${width}x${height}.jpg`);
}

export function downloadMatrixFile(contents: string, width: number, height: number): void {
  const blob = new Blob([contents], { type: "application/json" });
  downloadBlob(blob, `pixelpainter-${width}x${height}.json`);
}
