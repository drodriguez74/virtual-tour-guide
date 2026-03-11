import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { storyPrompt, langCode = "en" } = await req.json();

    if (!storyPrompt) {
      return Response.json({ error: "No story prompt" }, { status: 400 });
    }

    const language = langCode === "es" ? "Spanish" : "English";

    // Generate narration script + scene prompts
    const scriptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a BBC documentary narrator. Generate content in ${language}. Return a JSON object with:
- "narration": a 90-second narration script (about 200 words) written in a cinematic documentary style
- "scenes": an array of exactly 5 image generation prompts. Each prompt should describe a cinematic scene for DALL-E 3 in vivid detail — hyper-realistic, BBC documentary style, dramatic lighting, cinematic composition. Each prompt must be in English regardless of narration language.

Return ONLY valid JSON, no markdown.`,
        },
        { role: "user", content: storyPrompt },
      ],
      temperature: 0.8,
    });

    const scriptText = scriptResponse.choices[0]?.message?.content || "";
    let parsed: { narration: string; scenes: string[] };
    try {
      parsed = JSON.parse(scriptText);
    } catch {
      return Response.json(
        { error: "Failed to parse story script" },
        { status: 500 }
      );
    }

    // Generate all 5 scene images in parallel
    const imagePromises = parsed.scenes.map((scenePrompt) =>
      openai.images
        .generate({
          model: "dall-e-3",
          prompt: scenePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        })
        .then((res) => res.data?.[0]?.url || "")
        .catch(() => "")
    );

    const imageUrls = await Promise.all(imagePromises);

    return Response.json({
      narration: parsed.narration,
      images: imageUrls.filter(Boolean),
    });
  } catch (error) {
    console.error("Story API error:", error);
    return Response.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
