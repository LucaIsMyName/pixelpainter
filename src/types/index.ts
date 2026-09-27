export type RGBColor = {
  r: number;
  g: number;
  b: number;
};

export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export type PaintColor = {
  id: string;
  name: string;
  hex: string;
};

export const MIX_ALGORITHM = "rgb-linear-nnls" as const;
export type MixAlgorithm = typeof MIX_ALGORITHM;

export type PaintMix = {
  algorithm: MixAlgorithm;
  weights: Record<string, number>;
  reconstructed: RGBColor;
};

export type PixelData = {
  targetColor: RGBColor;
  mix: PaintMix;
};

export type Crop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SourceImage = {
  bitmap: ImageBitmap;
  objectUrl: string;
  width: number;
  height: number;
  fileName: string;
};

export type AppPhase = "start" | "crop" | "editor";

export type PixelCoord = {
  x: number;
  y: number;
};

export type PixelPainterProject = {
  source: SourceImage | null;
  crop: Crop | null;
  width: number;
  height: number;
  palette: PaintColor[];
  pixels: PixelData[][];
};
