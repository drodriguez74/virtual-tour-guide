import { LANDMARK_STORIES } from "@/lib/landmarks";
import { serverError } from "@/lib/api-utils";
import { apiLog } from "@/lib/api-logger";

export const maxDuration = 60;

interface LandmarkContext {
  name: string;
  era: string;
  style: string;
  materials: string;
  palette: string;
  features: string[];
  sceneTokens: string[];
}

function getLandmarkContext(landmarkKey: string | null): LandmarkContext {
  const lm = landmarkKey ? LANDMARK_STORIES[landmarkKey] : null;
  const meta = lm?.heyday;
  return {
    name: lm?.name || "Italy",
    era: meta?.target_era || "ancient Rome",
    style: meta?.architectural_style || "classical Italian",
    materials: meta?.materials || "marble, travertine, and stone",
    palette: meta?.color_palette || "warm Mediterranean stone, terracotta, gold accents",
    features: meta?.key_features || ["classical columns", "arched doorways"],
    sceneTokens: meta?.scene_tokens || ["Italian piazza", "cypress trees"],
  };
}

function buildFramePrompt(frameStyle: string, ctx: LandmarkContext): string {
  const { name, era, style, materials, features, sceneTokens } = ctx;

  const prompts: Record<string, string> = {
    vintage:
      `Transform this photo into a vintage Italian postcard from ${era}. ` +
      `Add an aged sepia-toned decorative border with hand-illustrated vignettes of ${features.slice(0, 2).join(" and ")}. ` +
      `Add 'Saluti da ${name}' in ornate calligraphy at the bottom. ` +
      `Include a small Italian postal stamp in the corner.`,

    polaroid:
      `Place this photo inside a realistic Polaroid instant photo frame. ` +
      `Thick white border, extra wide at the bottom with '${name}' in handwritten pen. ` +
      `Slightly yellowed edges.`,

    film:
      `Present this photo as a frame from a vintage 35mm film strip. ` +
      `Black film edges with sprocket holes on both sides. ` +
      `'CINECITTÀ ITALIA' text along the film rebate.`,

    golden:
      `Place this photo inside an ornate Italian Renaissance gilded picture frame inspired by ${name}. ` +
      `Elaborately carved golden wood with baroque scrollwork. ` +
      `Materials echoing ${materials}.`,

    stamp:
      `Overlay this photo with a vintage Italian passport stamp commemorating ${name}. ` +
      `Circular red ink stamp with '${name}' curved on top, '${era}' at center, 'ITALIA' on bottom. ` +
      `Add a rectangular blue 'INGRESSO' stamp.`,

    poster:
      `Transform this photo into a retro 1950s Italian tourism poster celebrating ${name}. ` +
      `Bold art deco border in navy and gold. 'VISIT' at top, '${name}' in bold capitals at bottom. ` +
      `Corner vignettes of ${sceneTokens.slice(0, 2).join(", ")}.`,
  };

  return prompts[frameStyle] || prompts.vintage;
}

const VALID_STYLES = ["vintage", "polaroid", "film", "golden", "stamp", "poster"];

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export async function POST(req: Request) {
  const log = apiLog("photo-frames");
  try {
    const { imageBase64, frameStyle, landmarkKey } = await req.json();

    if (!frameStyle || !VALID_STYLES.includes(frameStyle)) {
      return Response.json({ error: "Invalid frame style" }, { status: 400 });
    }

    if (!imageBase64) {
      return Response.json({ error: "Image is required" }, { status: 400 });
    }

    const ctx = getLandmarkContext(landmarkKey);
    const prompt = buildFramePrompt(frameStyle, ctx);

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    };

    let geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Only retry with a generic fallback prompt on content-related errors (400).
    // Don't retry on rate limits (429) or server errors (5xx) — it just wastes quota.
    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) {
        log.error(`Gemini rate limited: ${geminiResponse.status}`);
        return Response.json({ error: "Rate limited — please try again shortly" }, { status: 429 });
      }

      if (geminiResponse.status === 400) {
        const fallbackBody = {
          contents: [
            {
              parts: [
                { text: `Apply a beautiful decorative ${frameStyle} style photo frame to this image.` },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        };

        geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackBody),
        });
      }
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      log.error(`Gemini API error: ${geminiResponse.status} ${errText}`);
      return Response.json({ error: "Image generation failed" }, { status: 502 });
    }

    const result = await geminiResponse.json();

    // Extract image from response
    const candidates = result.candidates || [];
    let imageDataUrl: string | null = null;

    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inline_data) {
          const respMime = part.inline_data.mime_type || "image/png";
          imageDataUrl = `data:${respMime};base64,${part.inline_data.data}`;
          break;
        }
      }
      if (imageDataUrl) break;
    }

    if (!imageDataUrl) {
      return Response.json({ error: "No image in response" }, { status: 502 });
    }

    log.done({ landmark: landmarkKey || "generic", frame: frameStyle });

    return Response.json({ imageDataUrl, frameStyle });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return serverError();
  }
}
