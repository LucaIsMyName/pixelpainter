import {
  buildSessionSnapshot,
  clearSessionFromLocalStorage,
  loadSessionFromLocalStorage,
  parseSessionForRestore,
  saveSessionToLocalStorage,
  type ParsedSessionRestore,
  type PersistableProject,
} from "@/lib/persistence/session-snapshot";
import {
  clearSourceBlob,
  loadSourceBlob,
  saveSourceBlob,
} from "@/lib/persistence/idb";

export async function persistSession(
  project: PersistableProject,
  sourceBlob: Blob | null,
): Promise<void> {
  const hasSourceBlob = Boolean(project.source && sourceBlob);
  const snapshot = buildSessionSnapshot(project, hasSourceBlob);
  if (!snapshot) {
    await clearSession();
    return;
  }
  saveSessionToLocalStorage(snapshot);
  if (project.source && sourceBlob) {
    await saveSourceBlob(sourceBlob);
  } else if (!project.source) {
    await clearSourceBlob();
  }
}

export async function clearSession(): Promise<void> {
  clearSessionFromLocalStorage();
  await clearSourceBlob();
}

export type LoadedSession = ParsedSessionRestore & {
  sourceBlob: Blob | null;
};

export async function loadSession(): Promise<
  LoadedSession | { error: string } | null
> {
  const snapshot = loadSessionFromLocalStorage();
  if (!snapshot) {
    return null;
  }
  const parsed = parseSessionForRestore(snapshot);
  if ("error" in parsed) {
    return parsed;
  }

  let sourceBlob: Blob | null = null;
  if (parsed.sourceMeta?.hasBlob) {
    sourceBlob = await loadSourceBlob();
  }

  return { ...parsed, sourceBlob };
}
