import type { Crop, RGBColor, SourceImage } from "@/types";
import { colorsFromImageBuffer } from "@/lib/image-processing/sample-core";

const MAX_SAMPLE_DIMENSION = 2400;

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
  return colorsFromImageBuffer(
    imageData.data,
    canvas.width,
    canvas.height,
    width,
    height,
  );
}

export function cropToImageData(
  source: SourceImage,
  crop: Crop,
  width: number,
  height: number,
): ImageData {
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

  return context.getImageData(0, 0, canvas.width, canvas.height);
}
