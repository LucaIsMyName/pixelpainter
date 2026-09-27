import type {
  AppPhase,
  Crop,
  PaintColor,
  PixelCoord,
  PixelData,
} from "@/types";
import { parseMatrix, serializeMatrix } from "@/lib/matrix";

export const SESSION_STORAGE_KEY = "pixelpainter-session-v1";

export type SessionSnapshotV1 = {
  version: 1;
  savedAt: string;
  phase: AppPhase;
  width: number;
  height: number;
  crop: Crop | null;
  palette: PaintColor[];
  matrixJson: string | null;
  selectedPixel: PixelCoord | null;
  source: { fileName: string; mimeType: string; hasBlob: boolean } | null;
};

export type PersistableProject = {
  phase: AppPhase;
  width: number;
  height: number;
  crop: Crop | null;
  palette: PaintColor[];
  pixels: PixelData[][];
  selectedPixel: PixelCoord | null;
  source: { fileName: string; mimeType: string } | null;
};

export function buildSessionSnapshot(
  project: PersistableProject,
  hasSourceBlob: boolean,
): SessionSnapshotV1 | null {
  if (project.phase === "start") {
    return null;
  }

  const matrixJson =
    project.pixels.length > 0
      ? serializeMatrix(
          project.width,
          project.height,
          project.palette,
          project.pixels,
        )
      : null;

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    phase: project.phase,
    width: project.width,
    height: project.height,
    crop: project.crop,
    palette: project.palette.map((paint) => ({ ...paint })),
    matrixJson,
    selectedPixel: project.selectedPixel,
    source: project.source
      ? {
          fileName: project.source.fileName,
          mimeType: project.source.mimeType,
          hasBlob: hasSourceBlob,
        }
      : null,
  };
}

export function parseSessionSnapshot(raw: string): SessionSnapshotV1 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as SessionSnapshotV1).version !== 1
    ) {
      return null;
    }
    const snapshot = parsed as SessionSnapshotV1;
    if (
      snapshot.phase !== "start" &&
      snapshot.phase !== "crop" &&
      snapshot.phase !== "editor"
    ) {
      return null;
    }
    if (
      typeof snapshot.width !== "number" ||
      typeof snapshot.height !== "number" ||
      !Array.isArray(snapshot.palette)
    ) {
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}

export type ParsedSessionRestore = {
  phase: AppPhase;
  width: number;
  height: number;
  crop: Crop | null;
  palette: PaintColor[];
  pixels: PixelData[][];
  selectedPixel: PixelCoord | null;
  sourceMeta: { fileName: string; mimeType: string; hasBlob: boolean } | null;
};

export function parseSessionForRestore(
  snapshot: SessionSnapshotV1,
): ParsedSessionRestore | { error: string } {
  let pixels: PixelData[][] = [];
  let palette = snapshot.palette;

  if (snapshot.matrixJson) {
    const result = parseMatrix(snapshot.matrixJson);
    if (!result.ok) {
      return { error: result.error };
    }
    pixels = result.value.pixels;
    palette = result.value.palette;
    if (
      result.value.width !== snapshot.width ||
      result.value.height !== snapshot.height
    ) {
      return { error: "Session snapshot dimensions do not match matrix data." };
    }
  }

  return {
    phase: snapshot.phase,
    width: snapshot.width,
    height: snapshot.height,
    crop: snapshot.crop,
    palette,
    pixels,
    selectedPixel: snapshot.selectedPixel,
    sourceMeta: snapshot.source,
  };
}

export function saveSessionToLocalStorage(snapshot: SessionSnapshotV1): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadSessionFromLocalStorage(): SessionSnapshotV1 | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseSessionSnapshot(raw);
  } catch {
    return null;
  }
}

export function clearSessionFromLocalStorage(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
