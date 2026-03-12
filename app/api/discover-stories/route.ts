import OpenAI from "openai";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { placeDescription, destination, langCode = "en" } = await req.json();

    if (!placeDescription) {
      return Response.json(
        { error: "No place description provided" },
        { status: 400 }
      );
    }

    const language = langCode === "es" ? "Spanish" : "English";
    console.log(
      `[discover-stories] dest=${destination} lang=${langCode} descLen=${placeDescription.length}`
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a travel documentary expert. Given a description of a place, generate story chapters that a BBC-style documentary narrator could tell about it. Respond in JSON only — no markdown, no explanation.

Return a JSON object with:
- "placeName": a short, recognisable name for the place (e.g. "The Parthenon", "Temple of Karnak")
- "stories": an array of 3-4 story objects, each with:
  - "id": a snake_case identifier (e.g. "construction_history")
  - "title": a short compelling title (in ${language})
  - "description": one sentence describing the story angle (in ${language})
  - "prompt": a detailed prompt for a documentary narrator to create a ~200 word cinematic narration about this specific story angle. The prompt should request historically accurate, dramatic, engaging content. Always in English regardless of language setting.

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Place context: Destination is ${destination}.\n\nPlace description from AI tour guide commentary:\n${placeDescription}`,
        },
      ],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "";
    let parsed: {
      placeName: string;
      stories: {
        id: string;
        title: string;
        description: string;
        prompt: string;
      }[];
    };

    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Failed to parse story suggestions" },
        { status: 500 }
      );
    }

    if (!parsed.placeName || !Array.isArray(parsed.stories)) {
      return Response.json(
        { error: "Invalid response structure" },
        { status: 500 }
      );
    }

    return Response.json({
      placeName: parsed.placeName,
      stories: parsed.stories,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to discover stories";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[discover-stories] API error:", message, stack);
    return Response.json({ error: message }, { status: 500 });
  }
}
