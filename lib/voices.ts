/**
 * Gemini TTS voice mapping — destination × language.
 *
 * Voices: https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * English voices: male by default.
 * Spanish voices: female by default (Latin American style).
 *
 * ── English (male) ──
 * Marco (Italy)       → Charon      (male, informative — gives a nice Italian cadence)
 * Elena (Greece)      → Achird      (male, friendly and approachable)
 * Dr. Hassan (Egypt)  → Sadaltager  (male, knowledgeable and authoritative)
 * Default / Custom    → Achird      (male, friendly and approachable)
 *
 * ── Spanish (female, Latin American) ──
 * Marco (Italy)       → Leda        (female, youthful and bright)
 * Elena (Greece)      → Aoede       (female, breezy and natural)
 * Dr. Hassan (Egypt)  → Algenib     (female, gravelly and informative)
 * Default / Custom    → Aoede       (female, breezy and natural)
 */

type VoicePair = { en: string; es: string };

const DESTINATION_VOICES: Record<string, VoicePair> = {
  italy:  { en: "Charon",     es: "Leda" },
  greece: { en: "Achird",     es: "Aoede" },
  egypt:  { en: "Sadaltager", es: "Algenib" },
};

const DEFAULT_VOICES: VoicePair = { en: "Achird", es: "Aoede" };

/**
 * Returns the Gemini TTS voice name for a destination + language combo.
 */
export function getVoice(destination?: string, langCode?: string): string {
  const lang = langCode === "es" ? "es" : "en";
  const key = destination?.toLowerCase() ?? "";
  const pair = DESTINATION_VOICES[key] ?? DEFAULT_VOICES;
  return pair[lang];
}
