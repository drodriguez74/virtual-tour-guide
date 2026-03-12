import OpenAI from "openai";

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
          content: `You are an expert architectural historian. Analyze the photo and write a detailed DALL-E 3 image generation prompt that reconstructs this exact location as it appeared in its original glory.

Your prompt MUST:
- Identify the specific landmark, building, or ruin visible
- Describe how it would look fully restored (original materials, colors, decorations, surrounding structures)
- Maintain the exact same camera angle, framing, and perspective as the photo
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
              text: "Analyze this photo and write a DALL-E 3 prompt to reconstruct this location in its original historical glory.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const dallePrompt =
      analysisResponse.choices[0]?.message?.content ||
      "Photorealistic historical reconstruction of an ancient landmark in its original glory. Cinematic golden-hour lighting. BBC documentary illustration style.";

    // Step 2: Generate the historical reconstruction with DALL-E 3.  Wrap in a
    // try/catch so that if the prompt is rejected by OpenAI's safety system we
    // fall back to a generic, harmless prompt rather than failing the whole
    // request.  This can happen when GPT-4o returns text containing a banned
    // word (e.g. an obscene graffiti tag picked up from the photo).
    let imageUrl: string | undefined;

    const fallbackPrompt =
      "Photorealistic historical reconstruction of an ancient landmark in its original glory. Cinematic golden-hour lighting. BBC documentary illustration style.";

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
  } catch (error) {
    console.error("Heyday API error:", error);
    return Response.json(
      { error: "Failed to generate historical image" },
      { status: 500 }
    );
  }
}
