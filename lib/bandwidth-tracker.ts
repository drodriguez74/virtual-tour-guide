const STORAGE_KEY = "vtg-bandwidth";

interface BandwidthData {
  totalUp: number;   // bytes uploaded
  totalDown: number; // bytes downloaded
  startedAt: number; // epoch ms
}

function load(): BandwidthData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { totalUp: 0, totalDown: 0, startedAt: Date.now() };
}

function save(data: BandwidthData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/** Track bytes for a single request (upload + download) */
export function trackRequest(upBytes: number, downBytes: number) {
  const data = load();
  data.totalUp += upBytes;
  data.totalDown += downBytes;
  save(data);
}

/** Estimate byte size of a string (base64, JSON body, etc.) */
export function estimateBytes(str: string): number {
  return new Blob([str]).size;
}

/** Get human-readable usage summary */
export function getUsageSummary(): { total: string; up: string; down: string } {
  const data = load();
  const total = data.totalUp + data.totalDown;
  return {
    total: formatBytes(total),
    up: formatBytes(data.totalUp),
    down: formatBytes(data.totalDown),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
