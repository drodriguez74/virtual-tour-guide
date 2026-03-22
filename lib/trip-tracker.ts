/**
 * Trip Tracker — localStorage persistence for trip stats.
 * Used by Scavenger Hunt and Trip Scorecard.
 */

const STORAGE_KEY = "vtg-trip-stats";

export interface TripStats {
  landmarksVisited: string[];
  storiesWatched: string[];
  heydayPhotos: number;
  photosTaken: number;
  scavengerFinds: number;
  startedAt: string;
}

function defaultStats(): TripStats {
  return {
    landmarksVisited: [],
    storiesWatched: [],
    heydayPhotos: 0,
    photosTaken: 0,
    scavengerFinds: 0,
    startedAt: new Date().toISOString(),
  };
}

export function getTripStats(): TripStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TripStats;
  } catch { /* ignore */ }
  return defaultStats();
}

function save(stats: TripStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* best-effort */ }
}

export function recordLandmarkVisit(key: string): void {
  const stats = getTripStats();
  if (!stats.landmarksVisited.includes(key)) {
    stats.landmarksVisited.push(key);
    save(stats);
  }
}

export function recordStoryWatched(chapterId: string): void {
  const stats = getTripStats();
  if (!stats.storiesWatched.includes(chapterId)) {
    stats.storiesWatched.push(chapterId);
    save(stats);
  }
}

export function incrementStat(field: "heydayPhotos" | "photosTaken" | "scavengerFinds"): void {
  const stats = getTripStats();
  stats[field]++;
  save(stats);
}

export function resetTrip(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* best-effort */ }
}
