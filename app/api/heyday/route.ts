import OpenAI from "openai";

// Vercel serverless config — extend timeout for GPT-4o + DALL-E pipeline
export const maxDuration = 60; // seconds (requires Vercel Pro for >10s)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Step 1: Use GPT-4o vision to analyze the camera image and craft
    // a precise DALL-E prompt based on what's actually in the photo
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert historian with deep knowledge of architecture, urban development, and cultural history across all eras. Analyze the photo and write a detailed DALL-E 3 image generation prompt that shows the MOST INTERESTING historical version of this exact location.

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

Return ONLY the DALL-E prompt text, nothing else. No preamble, no explanation. Max 300 words.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Analyze this photo and write a DALL-E 3 prompt showing the most interesting historical version of this location. Use your intuition — it could be ancient history, what stood here before, or the same spot decades ago.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const dallePrompt =
      analysisResponse.choices[0]?.message?.content ||
      "Photorealistic historical scene of a famous location as it appeared in a past era — period-accurate architecture, people in authentic clothing, and era-appropriate vehicles and signage. Cinematic golden-hour lighting. Hyper-realistic BBC documentary illustration style.";

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

    return Response.json({ imageUrl });
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
