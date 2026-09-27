import type { RGBColor } from "@/types";
import { rgbToLinear } from "@/lib/color/convert";

export function rgbDistance(a: RGBColor, b: RGBColor): number {
  const da = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(da * da + dg * dg + db * db);
}

export function linearRgbDistance(a: RGBColor, b: RGBColor): number {
  const la = rgbToLinear(a);
  const lb = rgbToLinear(b);
  const dr = la[0] - lb[0];
  const dg = la[1] - lb[1];
  const db = la[2] - lb[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
