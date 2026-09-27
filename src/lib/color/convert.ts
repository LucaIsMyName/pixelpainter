import type { PaintColor, RGBColor } from "@/types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function srgbChannelToLinear(channel: number): number {
  const s = clamp(channel / 255, 0, 1);
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function linearChannelToSrgb(channel: number): number {
  const c = clamp(channel, 0, 1);
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(clamp(s, 0, 1) * 255);
}

export function rgbToLinear(color: RGBColor): [number, number, number] {
  return [
    srgbChannelToLinear(color.r),
    srgbChannelToLinear(color.g),
    srgbChannelToLinear(color.b),
  ];
}

export function linearToRgb(linear: [number, number, number]): RGBColor {
  return {
    r: linearChannelToSrgb(linear[0]),
    g: linearChannelToSrgb(linear[1]),
    b: linearChannelToSrgb(linear[2]),
  };
}

export function rgbToHex(color: RGBColor): string {
  const toHex = (value: number): string =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

export function hexToRgb(hex: string): RGBColor | null {
  const normalized = hex.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{3}$/.test(normalized)) {
    const r = normalized[0] ?? "0";
    const g = normalized[1] ?? "0";
    const b = normalized[2] ?? "0";
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }
  if (/^[0-9A-F]{6}$/.test(normalized)) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }
  return null;
}

export function normalizeHex(hex: string): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHex(rgb) : null;
}

export function rgbToHsl(color: RGBColor): { h: number; s: number; l: number } {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function formatRgb(color: RGBColor): string {
  return `${color.r}, ${color.g}, ${color.b}`;
}

export function formatHsl(color: RGBColor): string {
  const hsl = rgbToHsl(color);
  return `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;
}

export function colorsNearlyEqual(a: RGBColor, b: RGBColor): boolean {
  return (
    Math.abs(a.r - b.r) <= 1 &&
    Math.abs(a.g - b.g) <= 1 &&
    Math.abs(a.b - b.b) <= 1
  );
}

export function rgbFromPaint(paint: PaintColor): RGBColor {
  return hexToRgb(paint.hex) ?? { r: 0, g: 0, b: 0 };
}
