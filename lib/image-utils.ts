/**
 * Resize a base64 image to reduce bandwidth before sending to GPT-4o vision.
 * GPT-4o handles 640×360 fine for angle matching — saves ~150KB per call.
 */
export function resizeBase64ForAPI(
  base64: string,
  maxWidth = 640,
  quality = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(base64);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      // Strip the data URL prefix to return raw base64
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const compressed = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      resolve(compressed);
    };

    img.onerror = () => resolve(base64);

    // Handle both raw base64 and data URL format
    img.src = base64.startsWith("data:")
      ? base64
      : `data:image/jpeg;base64,${base64}`;
  });
}
