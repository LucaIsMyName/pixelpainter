import type { PaintColor, PixelData } from "@/types";
import { MIX_ALGORITHM } from "@/types";
import { createPaintMix, hexToRgb, rgbToHex } from "@/lib/color";
import { validateDimensions } from "@/lib/image-processing/dimensions";

export const MATRIX_FORMAT = "pixelpainter" as const;
export const MATRIX_VERSION = 1 as const;

export type PixelPainterMatrixV1 = {
  format: typeof MATRIX_FORMAT;
  version: typeof MATRIX_VERSION;
  width: number;
  height: number;
  palette: PaintColor[];
  pixels: Array<Array<{ hex: string; mix: Record<string, number> }>>;
  algorithm: typeof MIX_ALGORITHM;
  createdAt: string;
};

export type ParsedMatrix = {
  width: number;
  height: number;
  palette: PaintColor[];
  pixels: PixelData[][];
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePaintColor(value: unknown, index: number): PaintColor | string {
  if (!isRecord(value)) {
    return `Palette color ${index + 1} is invalid.`;
  }
  const { id, name, hex } = value;
  if (typeof id !== "string" || id.length === 0) {
    return `Palette color ${index + 1} is missing an id.`;
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return `Palette color ${index + 1} is missing a name.`;
  }
  if (typeof hex !== "string" || !hexToRgb(hex)) {
    return `Palette color ${index + 1} has an invalid color.`;
  }
  return { id, name: name.trim(), hex: hex.toUpperCase() };
}

export function serializeMatrix(
  width: number,
  height: number,
  palette: PaintColor[],
  pixels: PixelData[][],
): string {
  const document: PixelPainterMatrixV1 = {
    format: MATRIX_FORMAT,
    version: MATRIX_VERSION,
    width,
    height,
    palette,
    pixels: pixels.map((row) =>
      row.map((pixel) => ({
        hex: rgbToHex(pixel.targetColor),
        mix: pixel.mix.weights,
      })),
    ),
    algorithm: MIX_ALGORITHM,
    createdAt: new Date().toISOString(),
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function parseMatrix(text: string): ParseResult<ParsedMatrix> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "This is not a PixelPainter matrix file." };
  }

  if (parsed.format !== MATRIX_FORMAT) {
    return { ok: false, error: "This file is not a PixelPainter matrix." };
  }

  if (parsed.version !== MATRIX_VERSION) {
    return {
      ok: false,
      error: `This file uses PixelPainter format v${String(parsed.version)}, which this app cannot open.`,
    };
  }

  const width = parsed.width;
  const height = parsed.height;
  if (typeof width !== "number" || typeof height !== "number") {
    return { ok: false, error: "This matrix is missing width or height." };
  }
  const dimensionError = validateDimensions(width, height);
  if (dimensionError) {
    return { ok: false, error: dimensionError };
  }

  if (!Array.isArray(parsed.palette) || parsed.palette.length === 0) {
    return { ok: false, error: "This matrix has no paint palette." };
  }

  const palette: PaintColor[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < parsed.palette.length; i += 1) {
    const color = parsePaintColor(parsed.palette[i], i);
    if (typeof color === "string") {
      return { ok: false, error: color };
    }
    if (seenIds.has(color.id)) {
      return { ok: false, error: "This matrix has duplicate palette ids." };
    }
    seenIds.add(color.id);
    palette.push(color);
  }

  if (!Array.isArray(parsed.pixels) || parsed.pixels.length !== height) {
    return {
      ok: false,
      error: "The pixel data does not match the stated height.",
    };
  }

  const pixels: PixelData[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row = parsed.pixels[y];
    if (!Array.isArray(row) || row.length !== width) {
      return {
        ok: false,
        error: `Row ${y} does not match the stated width.`,
      };
    }
    const parsedRow: PixelData[] = [];
    for (let x = 0; x < width; x += 1) {
      const cell = row[x];
      if (!isRecord(cell) || typeof cell.hex !== "string") {
        return { ok: false, error: `Pixel ${x},${y} is invalid.` };
      }
      const targetColor = hexToRgb(cell.hex);
      if (!targetColor) {
        return { ok: false, error: `Pixel ${x},${y} has an invalid color.` };
      }
      if (!isRecord(cell.mix)) {
        return { ok: false, error: `Pixel ${x},${y} is missing mix data.` };
      }
      const weights: Record<string, number> = {};
      for (const paint of palette) {
        const value = cell.mix[paint.id];
        weights[paint.id] = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
      }
      parsedRow.push({
        targetColor,
        mix: createPaintMix(palette, weights),
      });
    }
    pixels.push(parsedRow);
  }

  return { ok: true, value: { width, height, palette, pixels } };
}

export function isMatrixFile(file: File): boolean {
  if (file.type === "application/json" || file.type === "text/plain") {
    return true;
  }
  return /\.(json|txt)$/i.test(file.name);
}
