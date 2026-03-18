import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { getPrompt } from "@/lib/prompts";
import { MAX_USER_TEXT, MAX_IMAGE_BASE64, MAX_MESSAGES, serverError } from "@/lib/api-utils";
import { apiLog } from "@/lib/api-logger";

export const maxDuration = 60;

// The commentary endpoint originally used Google Gemini, but the
// `gemini-1.5-pro` model was returning a 404 (not found/unsupported) on the
// v1beta API.  To make the app more robust we now allow switching the model
// via an environment variable and fall back to OpenAI's GPT-4o if the Gemini
// client fails.  This keeps the rest of the app unchanged.

import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview"; // try base name

export async function POST(req: Request) {
  const log = apiLog("commentary");
  try {
    const body = await req.json();
    const { messages, imageBase64, destination, latitude, longitude, langCode } = body;

    // Input validation
    if (messages && (!Array.isArray(messages) || messages.length > MAX_MESSAGES)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }
    if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_BASE64)) {
      return Response.json({ error: "Image too large" }, { status: 400 });
    }
    const lastMsg = messages?.[messages.length - 1]?.content;
    if (lastMsg && typeof lastMsg === "string" && lastMsg.length > MAX_USER_TEXT) {
      return Response.json({ error: "Message too long" }, { status: 400 });
    }

    const systemPrompt = getPrompt(destination, langCode, latitude, longitude);

    // Build conversation history if any
    const history: Content[] = [];
    if (messages && messages.length > 1) {
      const prior = messages.slice(0, -1);
      for (const msg of prior) {
        history.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    const lastUserMessage =
      messages?.[messages.length - 1]?.role === "user"
        ? messages[messages.length - 1].content
        : "What am I looking at? Tell me about this place.";

    // If we have a Gemini API key, try using it first.  If the call fails with
    // a 404 or similar, fall back to OpenAI GPT-4o.
    let stream: ReadableStream<Uint8Array> | null = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({
          model: GEMINI_MODEL,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history });
        const parts: Part[] = [{ text: lastUserMessage }];
        if (imageBase64) {
          parts.unshift({
            inlineData: { mimeType: "image/jpeg", data: imageBase64 },
          });
          parts.push({
            text: `The traveler is pointing their camera at this. ${lastUserMessage}`,
          });
        }
        const result = await chat.sendMessageStream(parts);
        const encoder = new TextEncoder();
        stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) controller.enqueue(encoder.encode(text));
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });
      } catch (err: any) {
        console.error("Gemini commentary failed, falling back to OpenAI:", err);
        stream = null;
      }
    }

    if (!stream) {
      // fallback path using OpenAI chat completion
      const promptParts: any[] = [];
      if (imageBase64) {
        // OpenAI doesn't support inline images easily; just append text note
        promptParts.push({ role: "user", content: "[User shared an image]" });
      }
      promptParts.push({ role: "user", content: lastUserMessage });
      const fullHistory = messages || [];
      const chatRes = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...fullHistory.map((m: any) => ({ role: m.role, content: m.content })),
          { role: "user", content: lastUserMessage },
        ],
        stream: true,
      });
      const encoder = new TextEncoder();
      stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatRes) {
              const textChunk = chunk.choices[0]?.delta?.content || "";
              if (textChunk) controller.enqueue(encoder.encode(textChunk));
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    }

    log.done({ lang: langCode, dest: destination, msgs: messages?.length || 0, hasImage: !!imageBase64 });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return serverError();
  }
}
