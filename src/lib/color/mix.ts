import type { MixAlgorithm, PaintColor, PaintMix, RGBColor } from "@/types";
import { MIX_ALGORITHM } from "@/types";
import {
  absorptionToRgb,
  colorsNearlyEqual,
  rgbFromPaint,
  rgbToAbsorption,
} from "@/lib/color/convert";

const MIX_ITERATIONS = 200;
const MIX_LEARNING_RATE = 0.015;

function projectOntoSimplex(vector: number[]): number[] {
  const n = vector.length;
  if (n === 0) {
    return [];
  }
  const sorted = [...vector].sort((a, b) => b - a);
  const cumulative: number[] = [];
  let running = 0;
  for (const value of sorted) {
    running += value;
    cumulative.push(running);
  }

  let rho = 0;
  for (let i = 0; i < n; i += 1) {
    const prefix = cumulative[i];
    const sortedValue = sorted[i];
    if (prefix === undefined || sortedValue === undefined) {
      continue;
    }
    const threshold = (prefix - 1) / (i + 1);
    if (sortedValue - threshold > 0) {
      rho = i;
    }
  }

  const prefixAtRho = cumulative[rho];
  if (prefixAtRho === undefined) {
    return vector.map(() => 1 / n);
  }
  const theta = (prefixAtRho - 1) / (rho + 1);
  return vector.map((value) => Math.max(value - theta, 0));
}

function mixAbsorption(
  paletteAbsorption: Array<[number, number, number]>,
  weights: number[],
): [number, number, number] {
  const mixed: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < paletteAbsorption.length; i += 1) {
    const color = paletteAbsorption[i];
    const weight = weights[i] ?? 0;
    if (!color) {
      continue;
    }
    mixed[0] += color[0] * weight;
    mixed[1] += color[1] * weight;
    mixed[2] += color[2] * weight;
  }
  return mixed;
}

function weightsRecord(
  palette: PaintColor[],
  values: number[],
): Record<string, number> {
  const record: Record<string, number> = {};
  for (let i = 0; i < palette.length; i += 1) {
    const paint = palette[i];
    if (!paint) {
      continue;
    }
    record[paint.id] = values[i] ?? 0;
  }
  return record;
}

function normalizedWeightValues(
  palette: PaintColor[],
  weights: Record<string, number>,
): number[] {
  const values = palette.map((paint) => Math.max(0, weights[paint.id] ?? 0));
  const sum = values.reduce((total, value) => total + value, 0);
  if (sum <= 0) {
    return values.map(() => 1 / Math.max(values.length, 1));
  }
  return values.map((value) => value / sum);
}

export function reconstructFromWeights(
  palette: PaintColor[],
  weights: Record<string, number>,
): RGBColor {
  const paletteAbsorption = palette.map((paint) =>
    rgbToAbsorption(rgbFromPaint(paint)),
  );
  const mixed = mixAbsorption(
    paletteAbsorption,
    normalizedWeightValues(palette, weights),
  );
  return absorptionToRgb(mixed);
}

export function createPaintMix(
  palette: PaintColor[],
  weights: Record<string, number>,
  algorithm: MixAlgorithm = MIX_ALGORITHM,
): PaintMix {
  return {
    algorithm,
    weights,
    reconstructed: reconstructFromWeights(palette, weights),
  };
}

export function calculatePaintMix(
  targetColor: RGBColor,
  palette: PaintColor[],
): PaintMix {
  if (palette.length === 0) {
    return {
      algorithm: MIX_ALGORITHM,
      weights: {},
      reconstructed: { ...targetColor },
    };
  }

  const exactIndex = palette.findIndex((paint) =>
    colorsNearlyEqual(rgbFromPaint(paint), targetColor),
  );
  if (exactIndex >= 0) {
    const weights: Record<string, number> = {};
    for (let i = 0; i < palette.length; i += 1) {
      const paint = palette[i];
      if (!paint) {
        continue;
      }
      weights[paint.id] = i === exactIndex ? 1 : 0;
    }
    return createPaintMix(palette, weights);
  }

  const paletteAbsorption = palette.map((paint) =>
    rgbToAbsorption(rgbFromPaint(paint)),
  );
  const targetAbsorption = rgbToAbsorption(targetColor);
  let weights = palette.map(() => 1 / palette.length);

  for (let iteration = 0; iteration < MIX_ITERATIONS; iteration += 1) {
    const mixed = mixAbsorption(paletteAbsorption, weights);
    const residual: [number, number, number] = [
      mixed[0] - targetAbsorption[0],
      mixed[1] - targetAbsorption[1],
      mixed[2] - targetAbsorption[2],
    ];
    const gradient = paletteAbsorption.map((color) => {
      return (
        color[0] * residual[0] +
        color[1] * residual[1] +
        color[2] * residual[2]
      );
    });
    const next = weights.map(
      (weight, index) => weight - MIX_LEARNING_RATE * (gradient[index] ?? 0),
    );
    weights = projectOntoSimplex(next);
  }

  const sum = weights.reduce((total, value) => total + value, 0);
  if (sum <= 0) {
    weights = palette.map(() => 1 / palette.length);
  } else {
    weights = weights.map((value) => value / sum);
  }

  return createPaintMix(palette, weightsRecord(palette, weights));
}

export function mixPercents(
  mix: PaintMix,
  palette: PaintColor[],
): Array<{ paint: PaintColor; percent: number }> {
  const tenths = palette.map((paint) =>
    Math.round((mix.weights[paint.id] ?? 0) * 1000),
  );
  let total = tenths.reduce((sum, value) => sum + value, 0);
  if (total === 0 && tenths.length > 0) {
    tenths[0] = 1000;
    total = 1000;
  }
  if (total !== 1000 && tenths.length > 0) {
    let largestIndex = 0;
    for (let i = 1; i < tenths.length; i += 1) {
      if ((tenths[i] ?? 0) > (tenths[largestIndex] ?? 0)) {
        largestIndex = i;
      }
    }
    const current = tenths[largestIndex] ?? 0;
    tenths[largestIndex] = current + (1000 - total);
  }
  return palette.map((paint, index) => ({
    paint,
    percent: (tenths[index] ?? 0) / 10,
  }));
}
