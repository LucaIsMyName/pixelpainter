import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Crop, PaintColor, PixelCoord } from "@/types";
import {
  buildPixelMatrixAsync,
  fitCropToAspect,
  largestCenteredCrop,
  loadImageBlob,
  loadImageFile,
  releaseSource,
  remixPixels,
  validateDimensions,
} from "@/lib/image-processing";
import { isMatrixFile, parseMatrix } from "@/lib/matrix";
import {
  clearSession,
  loadSession,
  persistSession,
} from "@/lib/persistence/session-store";
import { useDebouncedEffect } from "@/hooks/use-debounced-effect";
import {
  initialState,
  projectReducer,
  type AppState,
} from "@/state/project-reducer";

type ProjectContextValue = {
  state: AppState;
  loadImage: (file: File, options?: { skipReplaceCheck?: boolean }) => Promise<void>;
  loadMatrix: (file: File, options?: { skipReplaceCheck?: boolean }) => Promise<void>;
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
  setMismatchHighlight: (enabled: boolean) => void;
  setReferenceSplit: (enabled: boolean, opacity?: number) => void;
  hasRestorableWork: () => boolean;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const sourceBlobRef = useRef<Blob | null>(null);
  const hydrateStartedRef = useRef(false);
  const persistEnabledRef = useRef(false);
  const saveErrorShownRef = useRef(false);

  const persistCurrent = useCallback(async (snapshotState: AppState) => {
    try {
      await persistSession(
        {
          phase: snapshotState.phase,
          width: snapshotState.width,
          height: snapshotState.height,
          crop: snapshotState.crop,
          palette: snapshotState.palette,
          pixels: snapshotState.pixels,
          selectedPixel: snapshotState.selectedPixel,
          source: snapshotState.source
            ? {
                fileName: snapshotState.source.fileName,
                mimeType:
                  sourceBlobRef.current?.type ||
                  "application/octet-stream",
              }
            : null,
        },
        sourceBlobRef.current,
      );
    } catch {
      if (!saveErrorShownRef.current) {
        saveErrorShownRef.current = true;
        toast.error("Could not save session to this device.");
      }
    }
  }, []);

  useEffect(() => {
    if (hydrateStartedRef.current) {
      return;
    }
    hydrateStartedRef.current = true;

    void (async () => {
      dispatch({ type: "set-restoring", isRestoring: true });
      try {
        const loaded = await loadSession();
        if (!loaded) {
          persistEnabledRef.current = true;
          return;
        }
        if ("error" in loaded) {
          toast.error(loaded.error);
          await clearSession();
          persistEnabledRef.current = true;
          return;
        }

        let source: AppState["source"] = null;
        if (loaded.sourceMeta) {
          if (loaded.sourceBlob) {
            source = await loadImageBlob(
              loaded.sourceBlob,
              loaded.sourceMeta.fileName,
            );
            sourceBlobRef.current = loaded.sourceBlob;
          } else {
            toast.message(
              "Source image missing — re-upload to adjust crop or resize.",
            );
          }
        }

        dispatch({
          type: "session-restored",
          phase: loaded.phase,
          source,
          crop: loaded.crop,
          width: loaded.width,
          height: loaded.height,
          palette: loaded.palette,
          pixels: loaded.pixels,
          selectedPixel: loaded.selectedPixel,
        });
        toast.success("Restored your last session.");
      } catch {
        toast.error("Could not restore the previous session.");
      } finally {
        dispatch({ type: "set-restoring", isRestoring: false });
        persistEnabledRef.current = true;
      }
    })();
  }, []);

  useDebouncedEffect(
    () => {
      if (!persistEnabledRef.current || state.isProcessing) {
        return;
      }
      void persistCurrent(state);
    },
    [state],
    400,
  );

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
      void buildPixelMatrixAsync(source, crop, width, height, palette)
        .then((pixels) => {
          dispatch({ type: "grid-generated", pixels });
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Could not generate the pixel grid.";
          toast.error(message);
          dispatch({ type: "set-processing", isProcessing: false });
        });
    },
    [],
  );

  const loadImage = useCallback(
    async (file: File, options?: { skipReplaceCheck?: boolean }) => {
      void options;
      try {
        sourceBlobRef.current = file;
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
    async (file: File, options?: { skipReplaceCheck?: boolean }) => {
      void options;
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
        sourceBlobRef.current = null;
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
    sourceBlobRef.current = null;
    void clearSession();
    dispatch({ type: "reset" });
  }, [state.source]);

  const setMismatchHighlight = useCallback((enabled: boolean) => {
    dispatch({ type: "set-mismatch-highlight", enabled });
  }, []);

  const setReferenceSplit = useCallback((enabled: boolean, opacity?: number) => {
    dispatch({ type: "set-reference-split", enabled, opacity });
  }, []);

  const hasRestorableWork = useCallback(() => {
    return state.phase !== "start";
  }, [state.phase]);

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
      setMismatchHighlight,
      setReferenceSplit,
      hasRestorableWork,
    }),
    [
      confirmCrop,
      goToCrop,
      hasRestorableWork,
      loadImage,
      loadMatrix,
      newProject,
      selectPixel,
      setCrop,
      setDimensions,
      setMismatchHighlight,
      setReferenceSplit,
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
