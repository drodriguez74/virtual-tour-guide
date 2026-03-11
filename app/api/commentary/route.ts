import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrompt } from "@/lib/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, imageBase64, destination, latitude, longitude, langCode } =
      await req.json();

    const systemPrompt = getPrompt(destination, langCode, latitude, longitude);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Build conversation parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // System prompt
    parts.push({ text: systemPrompt });

    // Prior conversation history
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        parts.push({
          text: `${msg.role === "user" ? "Traveler" : "Tour Guide"}: ${msg.content}`,
        });
      }
    }

    // Current user message with optional image
    const lastUserMessage =
      messages?.[messages.length - 1]?.role === "user"
        ? messages[messages.length - 1].content
        : "What am I looking at? Tell me about this place.";

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      });
      parts.push({
        text: `The traveler is pointing their camera at this. ${lastUserMessage}`,
      });
    } else {
      parts.push({ text: `Traveler asks: ${lastUserMessage}` });
    }

    const result = await model.generateContentStream({ contents: [{ role: "user", parts }] });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Commentary API error:", error);
    return Response.json(
      { error: "Failed to generate commentary" },
      { status: 500 }
    );
  }
}
