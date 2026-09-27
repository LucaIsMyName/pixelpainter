import type { PaintColor } from "@/types";
import { colorsFromImageBuffer } from "@/lib/image-processing/sample-core";
import { mixTargetColors } from "@/lib/image-processing/matrix-from-image";

export type MatrixBuildRequest = {
  buffer: ArrayBuffer;
  bufferWidth: number;
  bufferHeight: number;
  gridWidth: number;
  gridHeight: number;
  palette: PaintColor[];
};

export type MatrixBuildResponse =
  | { ok: true; pixels: ReturnType<typeof mixTargetColors> }
  | { ok: false; error: string };

self.onmessage = (event: MessageEvent<MatrixBuildRequest>) => {
  try {
    const {
      buffer,
      bufferWidth,
      bufferHeight,
      gridWidth,
      gridHeight,
      palette,
    } = event.data;
    const data = new Uint8ClampedArray(buffer);
    const colors = colorsFromImageBuffer(
      data,
      bufferWidth,
      bufferHeight,
      gridWidth,
      gridHeight,
    );
    const pixels = mixTargetColors(colors, palette);
    const response: MatrixBuildResponse = { ok: true, pixels };
    self.postMessage(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Worker matrix build failed.";
    const response: MatrixBuildResponse = { ok: false, error: message };
    self.postMessage(response);
  }
};
