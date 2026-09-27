import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { PixelData } from "@/types";
import { rgbDistance, rgbToHex } from "@/lib/color";
import { PIXEL_CELL_SIZE } from "@/lib/image-processing/dimensions";

const MISMATCH_THRESHOLD = 18;
const CANVAS_CELL_THRESHOLD = 2500;

export function shouldUseCanvasGrid(width: number, height: number): boolean {
  return width * height >= CANVAS_CELL_THRESHOLD;
}

type PixelGridCanvasProps = {
  pixels: PixelData[][];
  selected: { x: number; y: number } | null;
  showGrid: boolean;
  showMismatchHighlight: boolean;
  showMixedColors: boolean;
  suppressClickRef: RefObject<boolean>;
  onSelect: (x: number, y: number) => void;
  onClear: () => void;
  onHover: (x: number, y: number, clientX: number, clientY: number) => void;
  onLeave: () => void;
};

export function PixelGridCanvas({
  pixels,
  selected,
  showGrid,
  showMismatchHighlight,
  showMixedColors,
  suppressClickRef,
  onSelect,
  onClear,
  onHover,
  onLeave,
}: PixelGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) {
      return;
    }
    canvas.width = width * PIXEL_CELL_SIZE;
    canvas.height = height * PIXEL_CELL_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
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
        context.fillStyle = rgbToHex(
          showMixedColors ? pixel.mix.reconstructed : pixel.targetColor,
        );
        context.fillRect(
          x * PIXEL_CELL_SIZE,
          y * PIXEL_CELL_SIZE,
          PIXEL_CELL_SIZE,
          PIXEL_CELL_SIZE,
        );
        if (showMismatchHighlight) {
          const mismatch = rgbDistance(
            pixel.targetColor,
            pixel.mix.reconstructed,
          );
          if (mismatch > MISMATCH_THRESHOLD) {
            context.strokeStyle = "rgba(220, 38, 38, 0.85)";
            context.lineWidth = 2;
            context.strokeRect(
              x * PIXEL_CELL_SIZE + 1,
              y * PIXEL_CELL_SIZE + 1,
              PIXEL_CELL_SIZE - 2,
              PIXEL_CELL_SIZE - 2,
            );
          }
        }
      }
    }
    if (showGrid) {
      context.strokeStyle = "rgba(0, 0, 0, 0.22)";
      context.lineWidth = 1;
      for (let x = 0; x <= width; x += 1) {
        context.beginPath();
        context.moveTo(x * PIXEL_CELL_SIZE + 0.5, 0);
        context.lineTo(x * PIXEL_CELL_SIZE + 0.5, canvas.height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += 1) {
        context.beginPath();
        context.moveTo(0, y * PIXEL_CELL_SIZE + 0.5);
        context.lineTo(canvas.width, y * PIXEL_CELL_SIZE + 0.5);
        context.stroke();
      }
    }
    if (selected) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.strokeRect(
        selected.x * PIXEL_CELL_SIZE + 1,
        selected.y * PIXEL_CELL_SIZE + 1,
        PIXEL_CELL_SIZE - 2,
        PIXEL_CELL_SIZE - 2,
      );
      context.strokeStyle = "#000000";
      context.lineWidth = 1;
      context.strokeRect(
        selected.x * PIXEL_CELL_SIZE + 2,
        selected.y * PIXEL_CELL_SIZE + 2,
        PIXEL_CELL_SIZE - 4,
        PIXEL_CELL_SIZE - 4,
      );
    }
  }, [height, pixels, selected, showGrid, showMismatchHighlight, showMixedColors, width]);

  const pickCell = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((clientX - rect.left) * scaleX) / PIXEL_CELL_SIZE);
      const y = Math.floor(((clientY - rect.top) * scaleY) / PIXEL_CELL_SIZE);
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return null;
      }
      return { x, y };
    },
    [height, width],
  );

  function onKeyDown(event: KeyboardEvent<HTMLCanvasElement>): void {
    if (!selected) {
      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        onSelect(0, 0);
        event.preventDefault();
      }
      return;
    }
    let x = selected.x;
    let y = selected.y;
    if (event.key === "ArrowRight") {
      x = Math.min(width - 1, x + 1);
    } else if (event.key === "ArrowLeft") {
      x = Math.max(0, x - 1);
    } else if (event.key === "ArrowDown") {
      y = Math.min(height - 1, y + 1);
    } else if (event.key === "ArrowUp") {
      y = Math.max(0, y - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClear();
      return;
    } else {
      return;
    }
    event.preventDefault();
    onSelect(x, y);
  }

  return (
    <canvas
      data-component="PixelGridCanvas"
      ref={canvasRef}
      role="img"
      aria-label={`Pixel grid ${width} by ${height}`}
      tabIndex={0}
      className="block cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        width: width * PIXEL_CELL_SIZE,
        height: height * PIXEL_CELL_SIZE,
      }}
      onKeyDown={onKeyDown}
      onMouseMove={(event) => {
        const cell = pickCell(event.clientX, event.clientY);
        if (cell) {
          onHover(cell.x, cell.y, event.clientX, event.clientY);
        }
      }}
      onMouseLeave={onLeave}
      onClick={(event) => {
        if (suppressClickRef.current) {
          return;
        }
        const cell = pickCell(event.clientX, event.clientY);
        if (cell) {
          onSelect(cell.x, cell.y);
        }
      }}
    />
  );
}
