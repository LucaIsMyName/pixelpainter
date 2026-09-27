import type { RGBColor } from "@/types";

function averageRegion(
  data: Uint8ClampedArray,
  bufferWidth: number,
  bufferHeight: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): RGBColor {
  const startX = Math.max(0, Math.min(bufferWidth - 1, Math.floor(x0)));
  const startY = Math.max(0, Math.min(bufferHeight - 1, Math.floor(y0)));
  const endX = Math.max(startX + 1, Math.min(bufferWidth, Math.ceil(x1)));
  const endY = Math.max(startY + 1, Math.min(bufferHeight, Math.ceil(y1)));

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * bufferWidth + x) * 4;
      r += data[index] ?? 0;
      g += data[index + 1] ?? 0;
      b += data[index + 2] ?? 0;
      count += 1;
    }
  }
  if (count === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

export function colorsFromImageBuffer(
  data: Uint8ClampedArray,
  bufferWidth: number,
  bufferHeight: number,
  gridWidth: number,
  gridHeight: number,
): RGBColor[][] {
  const pixels: RGBColor[][] = [];
  for (let row = 0; row < gridHeight; row += 1) {
    const line: RGBColor[] = [];
    const y0 = (row / gridHeight) * bufferHeight;
    const y1 = ((row + 1) / gridHeight) * bufferHeight;
    for (let column = 0; column < gridWidth; column += 1) {
      const x0 = (column / gridWidth) * bufferWidth;
      const x1 = ((column + 1) / gridWidth) * bufferWidth;
      line.push(
        averageRegion(data, bufferWidth, bufferHeight, x0, y0, x1, y1),
      );
    }
    pixels.push(line);
  }
  return pixels;
}
