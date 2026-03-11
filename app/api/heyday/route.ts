import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Photorealistic historical reconstruction of this location as it appeared in its original glory. Based on the ruins visible in a photo taken at this exact spot, reconstruct the full building or structure as it would have looked when newly built — with all original marble, paint, decorations, and surroundings intact. Maintain the exact same camera angle and perspective. Cinematic lighting, golden hour. Style: BBC documentary illustration, hyper-realistic, architectural accuracy.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
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
