import OpenAI from "openai";
import { LANDMARK_STORIES, HeydayMeta } from "@/lib/landmarks";

// Vercel serverless config — extend timeout for GPT-4o + DALL-E pipeline
export const maxDuration = 60; // seconds (requires Vercel Pro for >10s)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Build an enriched system prompt when we know which landmark this is */
function buildMetadataPrompt(name: string, meta: HeydayMeta, era?: string): string {
  return `You are an expert historian. The user is pointing their camera at **${name}**.

You have exact historical metadata for this site:
- Target era: ${era || meta.target_era}
- Architectural style: ${meta.architectural_style}
- Materials: ${meta.materials}
- Key visual details: ${meta.scene_tokens.join("; ")}
- Crowd/people: ${meta.crowd_description}
- Key features to restore: ${meta.key_features.join("; ")}
- Color palette: ${meta.color_palette}

Your job: write a DALL-E 3 prompt that reconstructs THIS EXACT CAMERA ANGLE of ${name} as it looked in ${era || meta.target_era}. The photo shows the user's current viewpoint — match that framing precisely, but replace ruins/decay with the fully restored version using the materials, colors, crowds, and details above.

Your prompt MUST:
- Match the exact camera angle and framing from the photo
- Use the specific materials, colors, and architectural details listed above
- Include people/crowds as described
- Restore all missing or damaged features listed in key features
- Specify cinematic golden-hour lighting
- Request hyper-realistic BBC documentary illustration style
- Be max 300 words

Return JSON (no markdown, no code fences):
{"prompt": "<DALL-E prompt>", "place": "${name}", "year": "${era || meta.target_era}"}`;
}

export async function POST(req: Request) {
  try {
    const { imageBase64, era, landmarkKey } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Look up metadata when we know which landmark this is
    const landmark = landmarkKey ? LANDMARK_STORIES[landmarkKey] : null;
    const meta = landmark?.heyday;

    // Build system prompt — enriched with metadata when available, generic otherwise
    const systemPrompt = meta
      ? buildMetadataPrompt(landmark!.name, meta, era)
      : `You are an expert historian with deep knowledge of architecture, urban development, and cultural history across all eras. Analyze the photo and write a detailed DALL-E 3 image generation prompt that shows the MOST INTERESTING historical version of this exact location.

Use your intuition to pick the most compelling era:
- For ANCIENT RUINS (e.g. Colosseum, Parthenon): show them fully restored in their prime — original materials, colors, decorations, bustling crowds in period clothing.
- For MODERN BUILDINGS built on historically significant ground (e.g. Freedom Tower/One WTC): show WHAT STOOD THERE BEFORE — the Twin Towers in their iconic form, busy with life. The point is to honor the history of the site, not just the current structure.
- For HISTORIC NEIGHBORHOODS that have been modernized (e.g. Times Square, old European quarters): show the same street 80-150 years ago — horse carriages, early automobiles, period signage, old storefronts.
- For ICONIC OLDER BUILDINGS still standing (e.g. Empire State Building, Eiffel Tower): show them during construction or shortly after completion, capturing the excitement of a new era.
- For NATURAL LANDSCAPES with human history: show the indigenous or pre-development scene — what this land looked like before the city arrived.

Your prompt MUST:
- Identify the specific location, building, or landmark visible
- Choose the most fascinating historical era for THIS specific place (not always ancient — could be 50, 100, or 200 years ago)
- Maintain the exact same camera angle, framing, and perspective as the photo
- Include people, vehicles, and details authentic to the chosen era
- Specify cinematic golden-hour lighting
- Request hyper-realistic BBC documentary illustration style

Return your response as JSON with exactly this format (no markdown, no code fences):
{"prompt": "<your DALL-E prompt, max 300 words>", "place": "<name of the place>", "year": "<year or era portrayed, e.g. 1920 or circa 300 BC>"}`;

    const userText = meta
      ? (era
          ? `This is ${landmark!.name}. Show this exact camera angle as it looked during: ${era}. Use the historical details provided.`
          : `This is ${landmark!.name}. Show this exact camera angle as it looked in ${meta.target_era}. Use the historical details provided.`)
      : (era
          ? `Analyze this photo and write a DALL-E 3 prompt showing this location as it would have looked during: ${era}. Focus on historically accurate details for that specific time period.`
          : "Analyze this photo and write a DALL-E 3 prompt showing the most interesting historical version of this location. Use your intuition — it could be ancient history, what stood here before, or the same spot decades ago.");

    // Step 1: Use GPT-4o vision to analyze the camera image and craft
    // a precise DALL-E prompt based on what's actually in the photo.
    // When landmark metadata is available, GPT-4o still sees the image
    // to match the exact camera angle, but now has exact historical context
    // instead of guessing.
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: meta ? "low" : "high",
              },
            },
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const rawAnalysis = analysisResponse.choices[0]?.message?.content || "";

    let dallePrompt: string;
    let caption: { place: string; year: string } = { place: "", year: "" };

    try {
      // Strip markdown code fences if present
      const cleaned = rawAnalysis.replace(/```json\s*|```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      dallePrompt = parsed.prompt || rawAnalysis;
      caption = { place: parsed.place || "", year: parsed.year || "" };
    } catch {
      // If JSON parsing fails, use the raw text as the prompt
      dallePrompt = rawAnalysis;
    }

    if (!dallePrompt) {
      dallePrompt =
        "Photorealistic historical scene of a famous location as it appeared in a past era — period-accurate architecture, people in authentic clothing, and era-appropriate vehicles and signage. Cinematic golden-hour lighting. Hyper-realistic BBC documentary illustration style.";
    }

    // Step 2: Generate the historical reconstruction with DALL-E 3.  Wrap in a
    // try/catch so that if the prompt is rejected by OpenAI's safety system we
    // fall back to a generic, harmless prompt rather than failing the whole
    // request.  This can happen when GPT-4o returns text containing a banned
    // word (e.g. an obscene graffiti tag picked up from the photo).
    let imageUrl: string | undefined;

    const fallbackPrompt =
      "Photorealistic historical scene of a famous location as it appeared in a past era — period-accurate architecture, people in authentic clothing, and era-appropriate vehicles and signage. Cinematic golden-hour lighting. Hyper-realistic BBC documentary illustration style.";

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      imageUrl = response.data?.[0]?.url;
    } catch (err: any) {
      // Only intercept safety failures, otherwise rethrow
      if (err?.code === "content_policy_violation" || err?.type === "image_generation_user_error") {
        console.warn("Heyday prompt rejected, using fallback prompt:", dallePrompt);
        try {
          const fallbackResp = await openai.images.generate({
            model: "dall-e-3",
            prompt: fallbackPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          });
          imageUrl = fallbackResp.data?.[0]?.url;
        } catch (e2) {
          console.error("Fallback heyday prompt also failed", e2);
        }
      } else {
        throw err;
      }
    }

    if (!imageUrl) {
      return Response.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return Response.json({ imageUrl, caption });
  } catch (error: any) {
    console.error("Heyday API error:", error);
    const message =
      error?.message || error?.code || "Failed to generate historical image";
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
