/**
 * Lightweight haptic feedback utility.
 *
 * Uses navigator.vibrate() which is supported on Android Chrome but NOT
 * on iOS Safari. Gracefully no-ops on unsupported platforms.
 */

type HapticStyle = "light" | "medium" | "heavy";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: [15, 30, 15],
};

function isSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function haptic(style: HapticStyle = "light"): void {
  if (!isSupported()) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    // Silently ignore — haptics are purely cosmetic
  }
}
