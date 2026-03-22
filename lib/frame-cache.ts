/**
 * IndexedDB cache for DALL-E generated photo frame overlays.
 * Frames are pre-generated in the background when approaching a landmark
 * and cached so they're instant when the user opens Photo Booth.
 */

const DB_NAME = "virtual-tour-frames";
const DB_VERSION = 1;
const STORE_NAME = "frames";

export interface CachedFrame {
  imageDataUrl: string;
  frameStyle: string;
  landmarkKey: string;
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

function cacheKey(landmarkKey: string, frameStyle: string): string {
  return `${landmarkKey}:${frameStyle}`;
}

export async function getCachedFrame(
  landmarkKey: string,
  frameStyle: string
): Promise<CachedFrame | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(cacheKey(landmarkKey, frameStyle));
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getCachedFramesForLandmark(
  landmarkKey: string
): Promise<Record<string, string>> {
  const styles = ["vintage", "polaroid", "film", "golden", "stamp", "poster"];
  const result: Record<string, string> = {};
  for (const style of styles) {
    const cached = await getCachedFrame(landmarkKey, style);
    if (cached) {
      result[style] = cached.imageDataUrl;
    }
  }
  return result;
}

export async function cacheFrame(
  landmarkKey: string,
  frameStyle: string,
  imageUrl: string
): Promise<void> {
  try {
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
      {
        imageDataUrl,
        frameStyle,
        landmarkKey,
        cachedAt: Date.now(),
      } as CachedFrame,
      cacheKey(landmarkKey, frameStyle)
    );
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * Pre-generate and cache all frame styles for a landmark.
 * Generates them sequentially to avoid overwhelming the API.
 * Returns silently on failure — this is a background optimization.
 */
export async function preloadFramesForLandmark(landmarkKey: string): Promise<void> {
  const styles = ["vintage", "polaroid", "film", "golden", "stamp", "poster"];

  for (const style of styles) {
    // Skip if already cached
    const existing = await getCachedFrame(landmarkKey, style);
    if (existing) continue;

    try {
      const response = await fetch("/api/photo-frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarkKey, frameStyle: style }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        await cacheFrame(landmarkKey, style, data.imageUrl);
      }
    } catch {
      // Best-effort — continue with remaining styles
    }
  }
}
