import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Crop, PaintColor, PixelCoord } from "@/types";
import {
  buildPixelMatrix,
  fitCropToAspect,
  largestCenteredCrop,
  loadImageFile,
  releaseSource,
  remixPixels,
  validateDimensions,
} from "@/lib/image-processing";
import { isMatrixFile, parseMatrix } from "@/lib/matrix";
import {
  initialState,
  projectReducer,
  type AppState,
} from "@/state/project-reducer";

type ProjectContextValue = {
  state: AppState;
  loadImage: (file: File) => Promise<void>;
  loadMatrix: (file: File) => Promise<void>;
  setCrop: (crop: Crop) => void;
  setDimensions: (width: number, height: number) => string | null;
  confirmCrop: () => void;
  updatePalette: (
    palette: PaintColor[],
    options?: { remix?: boolean },
  ) => string | null;
  selectPixel: (pixel: PixelCoord | null) => void;
  goToCrop: () => void;
  newProject: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

function runLater(work: () => void): void {
  window.setTimeout(work, 20);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  const loadImage = useCallback(
    async (file: File) => {
      try {
        const source = await loadImageFile(file);
        const aspect = state.width / state.height;
        const crop = largestCenteredCrop(source.width, source.height, aspect);
        releaseSource(state.source);
        dispatch({ type: "image-loaded", source, crop });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not open this image.";
        toast.error(message);
      }
    },
    [state.height, state.source, state.width],
  );

  const loadMatrix = useCallback(
    async (file: File) => {
      if (!isMatrixFile(file) && !file.name.toLowerCase().endsWith(".json")) {
        toast.error("Please choose a PixelPainter .json or .txt matrix file.");
        return;
      }
      try {
        const text = await file.text();
        const result = parseMatrix(text);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        releaseSource(state.source);
        dispatch({
          type: "matrix-loaded",
          width: result.value.width,
          height: result.value.height,
          palette: result.value.palette,
          pixels: result.value.pixels,
        });
      } catch {
        toast.error("Could not read this matrix file.");
      }
    },
    [state.source],
  );

  const setCrop = useCallback((crop: Crop) => {
    dispatch({ type: "set-crop", crop });
  }, []);

  const generateFromSource = useCallback(
    (
      source: NonNullable<AppState["source"]>,
      crop: Crop,
      width: number,
      height: number,
      palette: PaintColor[],
    ) => {
      if (palette.length === 0) {
        toast.error("Add at least one paint color before generating.");
        return;
      }
      dispatch({ type: "set-processing", isProcessing: true });
      runLater(() => {
        try {
          const pixels = buildPixelMatrix(source, crop, width, height, palette);
          dispatch({ type: "grid-generated", pixels });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not generate the pixel grid.";
          toast.error(message);
          dispatch({ type: "set-processing", isProcessing: false });
        }
      });
    },
    [],
  );

  const setDimensions = useCallback(
    (width: number, height: number) => {
      const error = validateDimensions(width, height);
      if (error) {
        toast.error(error);
        return error;
      }
      const aspect = width / height;
      const crop = state.source
        ? fitCropToAspect(
            state.source.width,
            state.source.height,
            aspect,
            state.crop,
          )
        : state.crop;
      dispatch({ type: "set-dimensions", width, height, crop });
      if (state.phase === "editor" && state.source && crop) {
        generateFromSource(state.source, crop, width, height, state.palette);
      }
      return null;
    },
    [
      generateFromSource,
      state.crop,
      state.palette,
      state.phase,
      state.source,
    ],
  );

  const confirmCrop = useCallback(() => {
    if (!state.source || !state.crop) {
      toast.error("Upload an image and choose a crop first.");
      return;
    }
    generateFromSource(
      state.source,
      state.crop,
      state.width,
      state.height,
      state.palette,
    );
  }, [
    generateFromSource,
    state.crop,
    state.height,
    state.palette,
    state.source,
    state.width,
  ]);

  const updatePalette = useCallback(
    (palette: PaintColor[], options?: { remix?: boolean }) => {
      if (palette.length === 0) {
        const error = "The palette must contain at least one paint color.";
        toast.error(error);
        return error;
      }
      const shouldRemix = options?.remix ?? true;
      const pixels =
        shouldRemix && state.pixels.length > 0
          ? remixPixels(state.pixels, palette)
          : state.pixels;
      dispatch({ type: "set-palette", palette, pixels });
      return null;
    },
    [state.pixels],
  );

  const selectPixel = useCallback((pixel: PixelCoord | null) => {
    dispatch({ type: "select-pixel", pixel });
  }, []);

  const goToCrop = useCallback(() => {
    if (!state.source) {
      toast.error("Upload a source image to adjust the crop.");
      return;
    }
    dispatch({ type: "go-to-crop" });
  }, [state.source]);

  const newProject = useCallback(() => {
    releaseSource(state.source);
    dispatch({ type: "reset" });
  }, [state.source]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      state,
      loadImage,
      loadMatrix,
      setCrop,
      setDimensions,
      confirmCrop,
      updatePalette,
      selectPixel,
      goToCrop,
      newProject,
    }),
    [
      confirmCrop,
      goToCrop,
      loadImage,
      loadMatrix,
      newProject,
      selectPixel,
      setCrop,
      setDimensions,
      state,
      updatePalette,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const value = useContext(ProjectContext);
  if (!value) {
    throw new Error("useProject must be used inside ProjectProvider.");
  }
  return value;
}
