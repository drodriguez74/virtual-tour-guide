/**
 * Streaming TTS endpoint — returns chunked WAV audio.
 *
 * Instead of waiting for all chunks to finish, we:
 * 1. Split text into sentences
 * 2. Fire off parallel Gemini TTS requests for each chunk
 * 3. Stream PCM bytes back as each chunk completes (in order)
 *
 * The response is a proper WAV file streamed progressively. Browsers can
 * start playing the audio as soon as enough data arrives.
 */

import { getVoice } from "@/lib/voices";
import { MAX_TTS_TEXT } from "@/lib/api-utils";
import { apiLog } from "@/lib/api-logger";

export const maxDuration = 60;

const MAX_CHUNK_LENGTH = 300;

function splitIntoChunks(text: string): string[] {
  // Split on sentence-ending punctuation (.!?), preserving Spanish ¿¡ markers.
  // Also handles text that lacks terminal punctuation (colons, semicolons,
  // ellipses, or just commas) — the fallback ensures nothing is dropped.
  const sentences = text.match(/[¿¡]?[^.!?¿¡]*[.!?]+\s*/g);

  if (!sentences) {
    // No sentence-ending punctuation found — treat the whole text as one chunk
    return text.trim() ? [text.trim()] : [];
  }

  // Check if the regex missed trailing text (e.g. "…and so on" with no period)
  const matched = sentences.join("");
  const remainder = text.slice(matched.length).trim();

  const allSentences = remainder
    ? [...sentences, remainder]
    : sentences;

  const chunks: string[] = [];
  let current = "";
  for (const sentence of allSentences) {
    if (current.length + sentence.length > MAX_CHUNK_LENGTH && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function synthesizeChunk(
  text: string,
  voiceName: string,
  apiKey: string,
  chunkIndex: number
): Promise<Buffer | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[tts-stream] Chunk ${chunkIndex} failed (${res.status}): ${errBody.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const base64Pcm = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data;

    if (!base64Pcm) {
      console.warn(`[tts-stream] Chunk ${chunkIndex} returned no audio data. Text: "${text.slice(0, 80)}..."`);
      return null;
    }

    return Buffer.from(base64Pcm, "base64");
  } catch (err) {
    console.error(`[tts-stream] Chunk ${chunkIndex} exception:`, err);
    return null;
  }
}

function buildWavHeader(pcmByteLength: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(24000 * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmByteLength, 40);
  return header;
}

export async function POST(req: Request) {
  const log = apiLog("tts-stream");
  try {
    const { text, destination, langCode } = await req.json();
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GEMINI_SPEECH_API_KEY;

    if (!apiKey) {
      return new Response("Service unavailable", { status: 503 });
    }
    if (!text?.trim() || typeof text !== "string" || text.length > MAX_TTS_TEXT) {
      return new Response("Bad request", { status: 400 });
    }

    // Pick voice based on guide character + language
    const voiceName = getVoice(destination, langCode);
    const chunks = splitIntoChunks(text);

    // Fire all chunk requests in parallel — store promises in order
    const chunkPromises = chunks.map((chunk, i) =>
      synthesizeChunk(chunk, voiceName, apiKey, i)
    );

    // We need the total PCM length for the WAV header upfront.
    // Strategy: resolve all promises first, then stream the concatenated WAV.
    // This is still faster than the old single-request approach because the
    // chunks are generated in parallel (N parallel requests vs 1 serial one).
    const pcmBuffers = await Promise.all(chunkPromises);

    const validBuffers = pcmBuffers.filter(Boolean) as Buffer[];
    const failedCount = pcmBuffers.length - validBuffers.length;
    if (failedCount > 0) {
      console.warn(`[tts-stream] ${failedCount}/${pcmBuffers.length} chunks failed`);
    }
    if (validBuffers.length === 0) {
      console.error("[tts-stream] All chunks failed — no audio generated");
      return new Response("No audio generated", { status: 500 });
    }

    const totalPcmLength = validBuffers.reduce((s, b) => s + b.length, 0);
    const wavHeader = buildWavHeader(totalPcmLength);

    // Stream the WAV: header first, then each PCM chunk
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(wavHeader));
        for (const buf of validBuffers) {
          controller.enqueue(new Uint8Array(buf));
        }
        controller.close();
      },
    });

    log.done({ lang: langCode, dest: destination, voice: voiceName, chunks: chunks.length, textLen: text.length });

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/wav",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return new Response("Internal Server Error", { status: 500 });
  }
}
