/**
 * Browser SpeechSynthesis fallback for when Gemini TTS API fails.
 */

/** Cancel any in-progress browser speech synthesis. */
export function stopBrowserTTS(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Map a short lang code to a BCP-47 tag for SpeechSynthesis. */
function toBcp47(langCode: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-US",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-BR",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
  };
  return map[langCode] || langCode;
}

/**
 * Try to find a voice matching the desired language and gender.
 * English defaults to male, Spanish defaults to female.
 */
function pickVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const bcp47 = toBcp47(langCode);
  const wantFemale = langCode === "es";

  // Filter voices that match the language
  const langVoices = voices.filter((v) => v.lang.startsWith(bcp47.split("-")[0]));
  if (langVoices.length === 0) return null;

  // Prefer Latin American Spanish voices specifically
  const regionVoices = langVoices.filter((v) => v.lang === bcp47);

  const pool = regionVoices.length > 0 ? regionVoices : langVoices;

  // Heuristic: voice names often contain gender hints
  const femaleHints = /female|femenin|mujer|paulina|monica|angelica|maria|elena|lupe|isabela|iolanda/i;
  const maleHints = /male(?!.*fe)|masculin|hombre|jorge|carlos|diego|juan|thomas|daniel|aaron/i;

  if (wantFemale) {
    const match = pool.find((v) => femaleHints.test(v.name) && !maleHints.test(v.name));
    if (match) return match;
  } else {
    const match = pool.find((v) => maleHints.test(v.name) && !femaleHints.test(v.name));
    if (match) return match;
  }

  // Fallback: just return the first matching voice
  return pool[0];
}

/**
 * Speak text using the browser's built-in SpeechSynthesis API.
 * Cancels any previous browser TTS before starting.
 * Returns the SpeechSynthesisUtterance so callers can track it.
 */
export function speakWithBrowserTTS(
  text: string,
  langCode: string
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("[BrowserTTS] SpeechSynthesis not available");
    return null;
  }

  // Cancel anything currently playing
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = toBcp47(langCode);
  utterance.rate = 1;
  utterance.pitch = 1;

  const voice = pickVoice(langCode);
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}
