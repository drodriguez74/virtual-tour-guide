// app/api/tts/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_SPEECH_API_KEY;

    // 1. Call the Gemini TTS Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        }
      }),
    });

    const data = await geminiRes.json();
    const base64Pcm = data.candidates[0].content.parts.find((p: any) => p.inlineData)?.inlineData.data;

    if (!base64Pcm) return NextResponse.json({ error: 'No audio' }, { status: 500 });

    // 2. CONVERSION: PCM L16 -> WAV
    const pcmBuffer = Buffer.from(base64Pcm, 'base64');
    const wavHeader = Buffer.alloc(44);
    
    // WAV Header Construction (Mono, 24000Hz, 16-bit)
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
    wavHeader.writeUInt16LE(1, 20);  // AudioFormat (PCM)
    wavHeader.writeUInt16LE(1, 22);  // NumChannels (Mono)
    wavHeader.writeUInt32LE(24000, 24); // SampleRate
    wavHeader.writeUInt32LE(24000 * 2, 28); // ByteRate
    wavHeader.writeUInt16LE(2, 32);  // BlockAlign
    wavHeader.writeUInt16LE(16, 34); // BitsPerSample
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    const finalAudioBase64 = Buffer.concat([wavHeader, pcmBuffer]).toString('base64');

    return NextResponse.json({ audioContent: finalAudioBase64 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}