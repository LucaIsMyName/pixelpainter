import type { PaintColor } from "@/types";
import { createPaintColor } from "@/lib/color/palette";

export type PalettePreset = {
  id: string;
  label: string;
  description: string;
  colors: Array<{ name: string; hex: string }>;
};

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "cmyk-w",
    label: "CMY+K+W",
    description: "Default subtractive set for mixing on screen.",
    colors: [
      { name: "Cyan", hex: "#00FFFF" },
      { name: "Magenta", hex: "#FF00FF" },
      { name: "Yellow", hex: "#FFFF00" },
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
    ],
  },
  {
    id: "rgb",
    label: "RGB",
    description: "Default subtractive set for mixing on screen.",
    colors: [
      { name: "Red", hex: "#f00" },
      { name: "Green", hex: "#0f0" },
      { name: "Blue", hex: "#00f" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#000" },
    ],
  },
  {
    id: "basic-acrylic",
    label: "Basic acrylic",
    description: "Common tube colors for general painting.",
    colors: [
      { name: "Titanium White", hex: "#F5F5F0" },
      { name: "Ivory Black", hex: "#1A1A1A" },
      { name: "Cadmium Red", hex: "#E03C31" },
      { name: "Ultramarine", hex: "#224BA1" },
      { name: "Hansa Yellow", hex: "#F3D024" },
      { name: "Burnt Umber", hex: "#6B3E2A" },
    ],
  },
  {
    id: "earth-tones",
    label: "Earth tones",
    description: "Muted landscape palette.",
    colors: [
      { name: "Raw Umber", hex: "#735943" },
      { name: "Yellow Ochre", hex: "#C9973B" },
      { name: "Burnt Sienna", hex: "#8A4A2E" },
      { name: "Sap Green", hex: "#4A6741" },
      { name: "Warm Gray", hex: "#9E9488" },
      { name: "Titan Buff", hex: "#E8DCC8" },
    ],
  },
  {
    id: "grayscale",
    label: "Grayscale",
    description: "Value study with black and white.",
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Light Gray", hex: "#B0B0B0" },
      { name: "Mid Gray", hex: "#707070" },
      { name: "Dark Gray", hex: "#383838" },
      { name: "Black", hex: "#000000" },
    ],
  },
];

export function paletteFromPreset(preset: PalettePreset): PaintColor[] {
  return preset.colors.map((color) => createPaintColor(color.name, color.hex));
}
