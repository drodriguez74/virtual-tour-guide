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
    es: "es-ES",
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

  window.speechSynthesis.speak(utterance);
  return utterance;
}
