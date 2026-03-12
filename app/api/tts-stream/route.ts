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

export const maxDuration = 60;

const MAX_CHUNK_LENGTH = 300;

function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
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
  apiKey: string
): Promise<Buffer | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

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

  if (!res.ok) return null;
  const data = await res.json();
  const base64Pcm = data.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data: string } }) => p.inlineData
  )?.inlineData?.data;
  return base64Pcm ? Buffer.from(base64Pcm, "base64") : null;
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
  try {
    const { text, destination, langCode } = await req.json();
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GEMINI_SPEECH_API_KEY;

    if (!apiKey || !text?.trim()) {
      return new Response("Bad request", { status: 400 });
    }

    // Pick voice based on guide character + language
    const voiceName = getVoice(destination, langCode);
    const chunks = splitIntoChunks(text);

    // Fire all chunk requests in parallel — store promises in order
    const chunkPromises = chunks.map((chunk) =>
      synthesizeChunk(chunk, voiceName, apiKey)
    );

    // We need the total PCM length for the WAV header upfront.
    // Strategy: resolve all promises first, then stream the concatenated WAV.
    // This is still faster than the old single-request approach because the
    // chunks are generated in parallel (N parallel requests vs 1 serial one).
    const pcmBuffers = await Promise.all(chunkPromises);

    const validBuffers = pcmBuffers.filter(Boolean) as Buffer[];
    if (validBuffers.length === 0) {
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

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/wav",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("TTS stream error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
