export const DEFAULT_GRID_WIDTH = 30;
export const DEFAULT_GRID_HEIGHT = 40;
export const MIN_GRID_SIZE = 4;
export const MAX_GRID_SIDE = 150;
export const MAX_GRID_CELLS = 10_000;
export const PIXEL_CELL_SIZE = 18;
export const JPG_PIXEL_SCALE = 40;
export const JPG_QUALITY = 0.92;

export function validateDimensions(width: number, height: number): string | null {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return "Width and height must be whole numbers.";
  }
  if (width < MIN_GRID_SIZE || height < MIN_GRID_SIZE) {
    return `Width and height must be at least ${MIN_GRID_SIZE}.`;
  }
  if (width > MAX_GRID_SIDE || height > MAX_GRID_SIDE) {
    return `Width and height cannot exceed ${MAX_GRID_SIDE}.`;
  }
  if (width * height > MAX_GRID_CELLS) {
    return `The grid cannot be larger than ${MAX_GRID_CELLS.toLocaleString()} pixels. Try a smaller size.`;
  }
  return null;
}

export function parseDimensionInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number.parseInt(trimmed, 10);
}
