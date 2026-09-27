import type { Crop, RGBColor, SourceImage } from "@/types";

const MAX_SAMPLE_DIMENSION = 2400;

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

export function sampleGrid(
  source: SourceImage,
  crop: Crop,
  width: number,
  height: number,
): RGBColor[][] {
  const canvas = document.createElement("canvas");
  const cropWidth = Math.max(1, Math.round(crop.width));
  const cropHeight = Math.max(1, Math.round(crop.height));
  const scale = Math.min(
    1,
    MAX_SAMPLE_DIMENSION / Math.max(cropWidth, cropHeight),
  );
  canvas.width = Math.max(width, Math.round(cropWidth * scale));
  canvas.height = Math.max(height, Math.round(cropHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not process this image in the browser.");
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(
    source.bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels: RGBColor[][] = [];

  for (let row = 0; row < height; row += 1) {
    const line: RGBColor[] = [];
    const y0 = (row / height) * canvas.height;
    const y1 = ((row + 1) / height) * canvas.height;
    for (let column = 0; column < width; column += 1) {
      const x0 = (column / width) * canvas.width;
      const x1 = ((column + 1) / width) * canvas.width;
      line.push(
        averageRegion(
          imageData.data,
          canvas.width,
          canvas.height,
          x0,
          y0,
          x1,
          y1,
        ),
      );
    }
    pixels.push(line);
  }

  return pixels;
}
