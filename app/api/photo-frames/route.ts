import OpenAI from "openai";
import { LANDMARK_STORIES } from "@/lib/landmarks";
import { serverError } from "@/lib/api-utils";
import { apiLog } from "@/lib/api-logger";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Frame style definitions with DALL-E prompt templates.
 * Each generates a decorative frame/border overlay image themed to a landmark.
 */
const FRAME_PROMPTS: Record<string, (landmarkName: string, destination: string) => string> = {
  vintage: (landmarkName, destination) =>
    `A vintage Italian postcard border design, ornate sepia-toned decorative frame with "Greetings from ${destination}" in elegant hand-lettered script at the bottom. Aged paper texture, postal stamp in corner with Italian flag colors, postmark marks. The CENTER must be completely empty/transparent — just the decorative border and text around the edges. Art nouveau style flourishes. Top-down flat design, no perspective.`,

  polaroid: (landmarkName) =>
    `A stylized Polaroid photo frame border design inspired by ${landmarkName}. Thick white border on all sides with extra space at the bottom. The bottom area has a subtle hand-drawn sketch of ${landmarkName} in light pencil. Slight shadow effect. The CENTER area must be completely empty — only the white frame border and bottom sketch area. Clean, minimal, flat design.`,

  film: (landmarkName) =>
    `A cinematic 35mm film strip border design. Black film strip edges with authentic sprocket holes running along left and right sides. Slight film grain texture on the border. Small "KODAK ITALIA" text along the edge. Frame counter showing "24A". The CENTER must be completely empty — only the film strip border elements around the edges. Flat graphic design, top-down.`,

  golden: (landmarkName) =>
    `An ornate Renaissance-era golden picture frame border inspired by the art frames in Italian galleries near ${landmarkName}. Elaborate carved gilded wood with baroque scrollwork, acanthus leaf corners, and shell motifs. Rich gold leaf texture with aged patina. The CENTER must be completely empty — only the decorative golden frame border. Flat top-down view, museum-quality detail.`,

  stamp: (landmarkName) =>
    `A vintage Italian passport stamp overlay design for ${landmarkName}. Circular red ink stamp with the landmark name in bold capitals curved along the top, today's date at center, "REPUBBLICA ITALIANA" curved along bottom, small eagle emblem, decorative star. Also include a rectangular entry/exit stamp nearby. Transparent background with only the stamp ink marks visible. Flat graphic design, authentic passport stamp aesthetic.`,

  poster: (landmarkName, destination) =>
    `A retro 1950s Italian travel poster border design advertising ${landmarkName}. Bold art deco frame in deep navy blue and gold. "VISIT" in large retro sans-serif at top, "${landmarkName.toUpperCase()}" in bold at bottom. Small illustrated vignettes of Italian motifs (olive branches, wine, vespa) in the corners. The CENTER must be completely empty — only the decorative poster border and text. Flat vintage illustration style, ENIT tourism poster aesthetic.`,
};

export async function POST(req: Request) {
  const log = apiLog("photo-frames");
  try {
    const { landmarkKey, frameStyle } = await req.json();

    if (!frameStyle || !FRAME_PROMPTS[frameStyle]) {
      return Response.json({ error: "Invalid frame style" }, { status: 400 });
    }

    const landmark = landmarkKey ? LANDMARK_STORIES[landmarkKey] : null;
    const landmarkName = landmark?.name || "Italy";
    const destination = "Italy";

    const prompt = FRAME_PROMPTS[frameStyle](landmarkName, destination);

    let imageUrl: string | undefined;
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      imageUrl = response.data?.[0]?.url;
    } catch (err: any) {
      if (err?.code === "content_policy_violation") {
        // Fallback to a generic decorative frame
        const fallbackResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `A decorative ${frameStyle} style photo frame border design. Ornate and beautiful. The CENTER must be completely empty — only the decorative border around the edges. Flat top-down graphic design.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        imageUrl = fallbackResponse.data?.[0]?.url;
      } else {
        throw err;
      }
    }

    if (!imageUrl) {
      return Response.json({ error: "No image generated" }, { status: 500 });
    }

    log.done({ landmark: landmarkKey || "generic", frame: frameStyle });

    return Response.json({ imageUrl, frameStyle, landmarkKey });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return serverError();
  }
}
