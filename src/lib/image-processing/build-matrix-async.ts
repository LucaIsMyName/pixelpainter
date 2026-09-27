import type { Crop, PaintColor, PixelData, SourceImage } from "@/types";
import type {
  MatrixBuildRequest,
  MatrixBuildResponse,
} from "@/workers/matrix-build.worker";
import { buildPixelMatrix } from "@/lib/image-processing/matrix-from-image";
import { cropToImageData } from "@/lib/image-processing/sample";

const GRID_CELL_WORKER_THRESHOLD = 900;

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("@/workers/matrix-build.worker.ts", import.meta.url),
      { type: "module" },
    );
  }
  return worker;
}

function buildInWorker(
  imageData: ImageData,
  gridWidth: number,
  gridHeight: number,
  palette: PaintColor[],
): Promise<PixelData[][]> {
  return new Promise((resolve, reject) => {
    const matrixWorker = getWorker();
    const request: MatrixBuildRequest = {
      buffer: imageData.data.buffer,
      bufferWidth: imageData.width,
      bufferHeight: imageData.height,
      gridWidth,
      gridHeight,
      palette,
    };

    const onMessage = (event: MessageEvent<MatrixBuildResponse>): void => {
      matrixWorker.removeEventListener("message", onMessage);
      matrixWorker.removeEventListener("error", onError);
      const result = event.data;
      if (result.ok) {
        resolve(result.pixels);
      } else {
        reject(new Error(result.error));
      }
    };

    const onError = (): void => {
      matrixWorker.removeEventListener("message", onMessage);
      matrixWorker.removeEventListener("error", onError);
      reject(new Error("Matrix worker failed."));
    };

    matrixWorker.addEventListener("message", onMessage);
    matrixWorker.addEventListener("error", onError);
    matrixWorker.postMessage(request, [imageData.data.buffer]);
  });
}

export async function buildPixelMatrixAsync(
  source: SourceImage,
  crop: Crop,
  width: number,
  height: number,
  palette: PaintColor[],
): Promise<PixelData[][]> {
  const cellCount = width * height;
  if (cellCount < GRID_CELL_WORKER_THRESHOLD) {
    return buildPixelMatrix(source, crop, width, height, palette);
  }

  try {
    const imageData = cropToImageData(source, crop, width, height);
    return await buildInWorker(imageData, width, height, palette);
  } catch {
    return buildPixelMatrix(source, crop, width, height, palette);
  }
}
