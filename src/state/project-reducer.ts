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

export type ProcessingKind = "idle" | "generating" | "restoring";

export type AppState = PixelPainterProject & {
  phase: AppPhase;
  selectedPixel: PixelCoord | null;
  isProcessing: boolean;
  processingKind: ProcessingKind;
  showMismatchHighlight: boolean;
  showMixedColors: boolean;
  referenceSplitEnabled: boolean;
  referenceSplitOpacity: number;
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
  processingKind: "idle",
  showMismatchHighlight: false,
  showMixedColors: false,
  referenceSplitEnabled: false,
  referenceSplitOpacity: 0.45,
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
  | { type: "set-restoring"; isRestoring: boolean }
  | { type: "go-to-crop" }
  | {
      type: "session-restored";
      phase: AppPhase;
      source: SourceImage | null;
      crop: Crop | null;
      width: number;
      height: number;
      palette: PaintColor[];
      pixels: PixelData[][];
      selectedPixel: PixelCoord | null;
    }
  | { type: "set-mismatch-highlight"; enabled: boolean }
  | { type: "set-mixed-colors"; enabled: boolean }
  | { type: "set-reference-split"; enabled: boolean; opacity?: number }
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
        processingKind: "idle",
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
        processingKind: "idle",
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
        processingKind: "idle",
      };
    case "session-restored":
      return {
        ...state,
        phase: action.phase,
        source: action.source,
        crop: action.crop,
        width: action.width,
        height: action.height,
        palette: action.palette,
        pixels: action.pixels,
        selectedPixel: action.selectedPixel,
        isProcessing: false,
        processingKind: "idle",
      };
    case "set-mismatch-highlight":
      return { ...state, showMismatchHighlight: action.enabled };
    case "set-mixed-colors":
      return { ...state, showMixedColors: action.enabled };
    case "set-reference-split":
      return {
        ...state,
        referenceSplitEnabled: action.enabled,
        referenceSplitOpacity:
          action.opacity ?? state.referenceSplitOpacity,
      };
    case "select-pixel":
      return { ...state, selectedPixel: action.pixel };
    case "set-processing":
      return {
        ...state,
        isProcessing: action.isProcessing,
        processingKind: action.isProcessing ? "generating" : "idle",
      };
    case "set-restoring":
      return {
        ...state,
        isProcessing: action.isRestoring,
        processingKind: action.isRestoring ? "restoring" : "idle",
      };
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
        processingKind: "idle",
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
