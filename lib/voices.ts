/**
 * Gemini TTS voice mapping — destination × language.
 *
 * Voices: https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * English voices are picked for character fit (accent, tone).
 * Spanish voices are picked for natural-sounding Spanish delivery.
 *
 * ── English ──
 * Marco (Italy)       → Charon      (male, informative — gives a nice Italian cadence)
 * Elena (Greece)      → Kore        (female, firm and confident)
 * Dr. Hassan (Egypt)  → Sadaltager  (male, knowledgeable and authoritative)
 * Default / Custom    → Achird      (male, friendly and approachable)
 *
 * ── Spanish ──
 * Marco (Italy)       → Orus        (male, firm and decisive — clean Spanish)
 * Elena (Greece)      → Aoede       (female, breezy and natural — smooth Spanish)
 * Dr. Hassan (Egypt)  → Alnilam     (male, firm and strong — clear Spanish)
 * Default / Custom    → Schedar     (male, even and balanced — neutral Spanish)
 */

type VoicePair = { en: string; es: string };

const DESTINATION_VOICES: Record<string, VoicePair> = {
  italy:  { en: "Charon",     es: "Orus" },
  greece: { en: "Kore",       es: "Aoede" },
  egypt:  { en: "Sadaltager", es: "Alnilam" },
};

const DEFAULT_VOICES: VoicePair = { en: "Achird", es: "Schedar" };

/**
 * Returns the Gemini TTS voice name for a destination + language combo.
 */
export function getVoice(destination?: string, langCode?: string): string {
  const lang = langCode === "es" ? "es" : "en";
  const key = destination?.toLowerCase() ?? "";
  const pair = DESTINATION_VOICES[key] ?? DEFAULT_VOICES;
  return pair[lang];
}
