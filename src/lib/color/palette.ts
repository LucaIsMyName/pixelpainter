import type { PaintColor } from "@/types";
import { normalizeHex } from "@/lib/color/convert";

export const DEFAULT_PALETTE: PaintColor[] = [
  { id: "cyan", name: "Cyan", hex: "#00FFFF" },
  { id: "magenta", name: "Magenta", hex: "#FF00FF" },
  { id: "yellow", name: "Yellow", hex: "#FFFF00" },
  { id: "black", name: "Black", hex: "#000000" },
  { id: "white", name: "White", hex: "#FFFFFF" },
];

export function createPaintColor(name: string, hex: string): PaintColor {
  const normalized = normalizeHex(hex) ?? "#808080";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `paint-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { id, name, hex: normalized };
}

export function clonePalette(palette: PaintColor[]): PaintColor[] {
  return palette.map((paint) => ({ ...paint }));
}
