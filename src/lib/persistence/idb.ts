const DB_NAME = "pixelpainter";
const DB_VERSION = 1;
const STORE_SOURCES = "sources";
export const SOURCE_BLOB_KEY = "current-source";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SOURCES)) {
        db.createObjectStore(STORE_SOURCES);
      }
    };
  });
}

export async function saveSourceBlob(blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCES, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed."));
    tx.objectStore(STORE_SOURCES).put(blob, SOURCE_BLOB_KEY);
  });
}

export async function loadSourceBlob(): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCES, "readonly");
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB read failed."));
    const request = tx.objectStore(STORE_SOURCES).get(SOURCE_BLOB_KEY);
    request.onsuccess = () => {
      db.close();
      const value = request.result;
      resolve(value instanceof Blob ? value : null);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB get failed."));
  });
}

export async function clearSourceBlob(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCES, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed."));
    tx.objectStore(STORE_SOURCES).delete(SOURCE_BLOB_KEY);
  });
}
