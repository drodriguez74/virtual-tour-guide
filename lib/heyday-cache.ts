const DB_NAME = "virtual-tour-heyday";
const DB_VERSION = 1;
const STORE_NAME = "heyday";

interface CachedHeyday {
  imageDataUrl: string;
  caption: { place: string; year: string } | null;
  cachedAt: number;
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

/** Build a cache key from landmark key and era */
function cacheKey(landmarkKey: string, era?: string): string {
  return `${landmarkKey}:${era || "auto"}`;
}

export async function getCachedHeyday(
  landmarkKey: string,
  era?: string
): Promise<CachedHeyday | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(cacheKey(landmarkKey, era));
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Download the DALL-E image URL and store as a data URL in IndexedDB.
 * DALL-E URLs expire, so we must persist the actual image data.
 */
export async function cacheHeyday(
  landmarkKey: string,
  imageUrl: string,
  caption: { place: string; year: string } | null,
  era?: string
): Promise<void> {
  try {
    // Download the image and convert to data URL
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(
      { imageDataUrl, caption, cachedAt: Date.now() } as CachedHeyday,
      cacheKey(landmarkKey, era)
    );
  } catch {
    // Silently fail — cache is best-effort
  }
}
