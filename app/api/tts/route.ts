import { NextResponse } from "next/server";
import { getVoice } from "@/lib/voices";

const MAX_CHUNK_LENGTH = 300; // characters per chunk — keeps each TTS call fast

/**
 * Split text into sentence-level chunks, each under MAX_CHUNK_LENGTH.
 * If a single sentence exceeds the limit it gets its own chunk.
 */
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
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}

/**
 * Call Gemini TTS for a single text chunk.
 * Returns raw PCM base64 or null on failure.
 */
async function synthesizeChunk(
  text: string,
  voiceName: string,
  apiKey: string
): Promise<string | null> {
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

  return base64Pcm || null;
}

/**
 * Build a WAV header for 24 kHz, 16-bit, mono PCM data.
 */
function buildWavHeader(pcmByteLength: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
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

    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    // Pick voice based on guide character + language
    const voiceName = getVoice(destination, langCode);

    const chunks = splitIntoChunks(text);

    // If short text (single chunk), use the fast non-chunked path
    if (chunks.length === 1) {
      const pcmBase64 = await synthesizeChunk(chunks[0], voiceName, apiKey);
      if (!pcmBase64) {
        return NextResponse.json({ error: "No audio" }, { status: 500 });
      }
      const pcmBuffer = Buffer.from(pcmBase64, "base64");
      const wav = Buffer.concat([buildWavHeader(pcmBuffer.length), pcmBuffer]);
      return NextResponse.json({
        audioContent: wav.toString("base64"),
        mimeType: "audio/wav",
      });
    }

    // For longer text, synthesize all chunks in parallel
    const results = await Promise.all(
      chunks.map((chunk) => synthesizeChunk(chunk, voiceName, apiKey))
    );

    // Concatenate all PCM buffers (skip failed chunks)
    const pcmBuffers: Buffer[] = [];
    for (const pcmBase64 of results) {
      if (pcmBase64) {
        pcmBuffers.push(Buffer.from(pcmBase64, "base64"));
      }
    }

    if (pcmBuffers.length === 0) {
      return NextResponse.json({ error: "No audio" }, { status: 500 });
    }

    const combinedPcm = Buffer.concat(pcmBuffers);
    const wav = Buffer.concat([
      buildWavHeader(combinedPcm.length),
      combinedPcm,
    ]);

    return NextResponse.json({
      audioContent: wav.toString("base64"),
      mimeType: "audio/wav",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
