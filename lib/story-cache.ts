const DB_NAME = "virtual-tour-stories";
const DB_VERSION = 1;
const STORE_NAME = "stories";

interface CachedStory {
  title: string;
  landmarkName: string;
  narration: string;
  images: string[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedStory(
  chapterId: string
): Promise<CachedStory | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(chapterId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheStory(
  chapterId: string,
  story: CachedStory
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(story, chapterId);
  } catch {
    // Silently fail — cache is best-effort
  }
}
