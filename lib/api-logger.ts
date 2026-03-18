/**
 * Structured API logger — outputs JSON lines viewable in Vercel function logs.
 *
 * Usage:
 *   const log = apiLog("commentary");
 *   // ... do work ...
 *   log.done({ lang: "es", tokens: 150 });
 *   // or
 *   log.error("timeout");
 */

// Rough cost estimates per API call (USD) for tracking spend
const COST_ESTIMATES: Record<string, number> = {
  story: 0.25,          // GPT-4o + 5× DALL-E 3
  heyday: 0.08,         // GPT-4o vision + 1× DALL-E 3
  commentary: 0.01,     // Gemini / GPT-4o streaming
  "discover-stories": 0.02, // GPT-4o
  "tts-stream": 0.005,  // Gemini TTS
  tts: 0.005,           // Gemini TTS
  geocode: 0,           // Free (Nominatim)
};

interface LogEntry {
  endpoint: string;
  status: "ok" | "error";
  durationMs: number;
  estimatedCost: number;
  error?: string;
  [key: string]: unknown;
}

interface ApiLogger {
  done: (extra?: Record<string, unknown>) => void;
  error: (reason: string, extra?: Record<string, unknown>) => void;
}

export function apiLog(endpoint: string): ApiLogger {
  const start = Date.now();

  function emit(entry: LogEntry) {
    // Single JSON line — easy to parse in Vercel logs / grep
    console.log(JSON.stringify(entry));
  }

  return {
    done(extra?: Record<string, unknown>) {
      emit({
        endpoint,
        status: "ok",
        durationMs: Date.now() - start,
        estimatedCost: COST_ESTIMATES[endpoint] ?? 0,
        ...extra,
      });
    },
    error(reason: string, extra?: Record<string, unknown>) {
      emit({
        endpoint,
        status: "error",
        durationMs: Date.now() - start,
        estimatedCost: 0,
        error: reason,
        ...extra,
      });
    },
  };
}
