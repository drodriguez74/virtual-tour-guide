/** Max length for user-typed text (commentary questions, custom story topics). */
export const MAX_USER_TEXT = 500;

/** Max length for base64 image payloads (~2MB decoded). */
export const MAX_IMAGE_BASE64 = 3_000_000;

/** Max number of messages in conversation history. */
export const MAX_MESSAGES = 30;

/** Max length for TTS text input. */
export const MAX_TTS_TEXT = 5_000;

/** Validate a string field is present and within length. */
export function validString(val: unknown, maxLen: number): val is string {
  return typeof val === "string" && val.trim().length > 0 && val.length <= maxLen;
}

/** Return a generic 500 error response (no internal details). */
export function serverError() {
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
