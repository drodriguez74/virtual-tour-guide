import OpenAI from "openai";
import { LANDMARK_STORIES } from "@/lib/landmarks";
import { MAX_IMAGE_BASE64, serverError } from "@/lib/api-utils";
import { apiLog } from "@/lib/api-logger";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const log = apiLog("story");
  try {
    const { storyPrompt, langCode = "en", imageBase64, landmarkKey } =
      await req.json();

    if (!storyPrompt || typeof storyPrompt !== "string" || storyPrompt.length > 2000) {
      return Response.json({ error: "Invalid story prompt" }, { status: 400 });
    }
    if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_BASE64)) {
      return Response.json({ error: "Image too large" }, { status: 400 });
    }

    const language = langCode === "es" ? "Spanish" : "English";
    const landmark = landmarkKey ? LANDMARK_STORIES[landmarkKey] : null;
    const meta = landmark?.heyday;

    // Build a context block that grounds scenes in the camera vantage point
    // and the holistic essence of the venue
    let vantagePreamble = "";
    if (meta && landmark) {
      vantagePreamble = `
VENUE CONTEXT — ${landmark.name}:
- Era: ${meta.target_era}
- Style: ${meta.architectural_style}
- Materials: ${meta.materials}
- Visual details: ${meta.scene_tokens.join("; ")}
- Crowds: ${meta.crowd_description}
- Key features: ${meta.key_features.join("; ")}
- Colors: ${meta.color_palette}

The user is physically standing at ${landmark.name} right now, looking at a specific section of it through their camera.`;
    }

    // Build message content — with or without the camera image
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: "low",
        },
      });
      userContent.push({
        type: "text",
        text: `The attached photo shows what the user is currently looking at — their exact camera angle and vantage point at this location.
${vantagePreamble}

Story topic: ${storyPrompt}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `${vantagePreamble ? vantagePreamble + "\n\n" : ""}Story topic: ${storyPrompt}`,
      });
    }

    // Generate narration script + scene prompts
    const scriptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a BBC documentary narrator and visual storyteller. Generate content in ${language}. Return a JSON object with:
- "narration": a 60-second narration script (about 130 words) written in a cinematic documentary style
- "scenes": an array of exactly 5 DALL-E 3 image prompts in English (regardless of narration language)

CRITICAL SCENE GUIDELINES:
${imageBase64 ? `- Scene 1 MUST be grounded in the exact camera angle from the attached photo — show THIS specific view of the site, reconstructed in the historical era described. Match the perspective, framing, and what's visible.` : "- Scene 1 should establish the location from a recognizable vantage point."}
- Scenes 2-4 should expand outward — show nearby areas, the broader venue, crowds, and how this specific spot fits into the whole site. Mix close-up architectural details with wider establishing shots. Include the holistic atmosphere: sounds you'd hear, smells, the bustling life around this place.
- Scene 5 should be a dramatic wide shot showing the full grandeur of the venue in its prime — the "pull back and reveal" moment.
- ALL scenes: hyper-realistic, cinematic 16:9 widescreen composition, dramatic golden-hour lighting, BBC documentary illustration style.
- ALL scenes: include historically accurate people, clothing, and activity appropriate to the era.
${meta ? `- Use these specific materials and colors: ${meta.color_palette}` : ""}

Return ONLY valid JSON, no markdown.`,
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.8,
    });

    const scriptText = scriptResponse.choices[0]?.message?.content || "";
    let parsed: { narration: string; scenes: string[] };
    try {
      const cleaned = scriptText.replace(/```json\s*|```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: "Failed to parse story script" },
        { status: 500 }
      );
    }

    // Generate all 5 scene images in parallel — landscape 16:9 for cinematic player
    const imagePromises = parsed.scenes.map((scenePrompt) =>
      openai.images
        .generate({
          model: "dall-e-3",
          prompt: scenePrompt,
          n: 1,
          size: "1792x1024",
          quality: "standard",
        })
        .then((res) => res.data?.[0]?.url || "")
        .catch(() => "")
    );

    const imageUrls = await Promise.all(imagePromises);

    log.done({ lang: langCode, landmark: landmarkKey || "none", hasImage: !!imageBase64, images: imageUrls.filter(Boolean).length });

    return Response.json({
      narration: parsed.narration,
      images: imageUrls.filter(Boolean),
    });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return serverError();
  }
}
