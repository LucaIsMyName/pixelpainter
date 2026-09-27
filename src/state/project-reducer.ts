import type {
  AppPhase,
  Crop,
  PaintColor,
  PixelCoord,
  PixelData,
  PixelPainterProject,
  SourceImage,
} from "@/types";
import { clonePalette, DEFAULT_PALETTE } from "@/lib/color";
import {
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
} from "@/lib/image-processing/dimensions";

export type AppState = PixelPainterProject & {
  phase: AppPhase;
  selectedPixel: PixelCoord | null;
  isProcessing: boolean;
};

export const initialState: AppState = {
  phase: "start",
  source: null,
  crop: null,
  width: DEFAULT_GRID_WIDTH,
  height: DEFAULT_GRID_HEIGHT,
  palette: clonePalette(DEFAULT_PALETTE),
  pixels: [],
  selectedPixel: null,
  isProcessing: false,
};

export type AppAction =
  | {
      type: "image-loaded";
      source: SourceImage;
      crop: Crop;
    }
  | { type: "set-crop"; crop: Crop }
  | { type: "set-dimensions"; width: number; height: number; crop: Crop | null }
  | { type: "set-palette"; palette: PaintColor[]; pixels: PixelData[][] }
  | { type: "grid-generated"; pixels: PixelData[][] }
  | {
      type: "matrix-loaded";
      width: number;
      height: number;
      palette: PaintColor[];
      pixels: PixelData[][];
    }
  | { type: "select-pixel"; pixel: PixelCoord | null }
  | { type: "set-processing"; isProcessing: boolean }
  | { type: "go-to-crop" }
  | { type: "reset" };

export function projectReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "image-loaded":
      return {
        ...state,
        phase: "crop",
        source: action.source,
        crop: action.crop,
        pixels: [],
        selectedPixel: null,
        isProcessing: false,
      };
    case "set-crop":
      return { ...state, crop: action.crop };
    case "set-dimensions":
      return {
        ...state,
        width: action.width,
        height: action.height,
        crop: action.crop ?? state.crop,
      };
    case "set-palette":
      return {
        ...state,
        palette: action.palette,
        pixels: action.pixels,
      };
    case "grid-generated":
      return {
        ...state,
        phase: "editor",
        pixels: action.pixels,
        selectedPixel: null,
        isProcessing: false,
      };
    case "matrix-loaded":
      return {
        ...state,
        phase: "editor",
        source: null,
        crop: null,
        width: action.width,
        height: action.height,
        palette: action.palette,
        pixels: action.pixels,
        selectedPixel: null,
        isProcessing: false,
      };
    case "select-pixel":
      return { ...state, selectedPixel: action.pixel };
    case "set-processing":
      return { ...state, isProcessing: action.isProcessing };
    case "go-to-crop":
      return {
        ...state,
        phase: "crop",
        selectedPixel: null,
      };
    case "reset":
      return {
        ...initialState,
        palette: clonePalette(DEFAULT_PALETTE),
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
