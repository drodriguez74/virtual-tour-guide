// app/api/tts/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_SPEECH_API_KEY; // Your Gemini Key from AI Studio

    // 1. Use the dedicated Gemini TTS endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        parts: [{
          // We "prompt" the voice style here!
          text: `Say this as Marco, a warm and enthusiastic Italian tour guide. 
                 Use a natural storytelling pace with a friendly tone: ${text}`
        }]
      }],
      // 2. Tell the model to output AUDIO instead of text
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore" // "Kore" is the high-fidelity male voice ideal for Marco
            }
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini TTS Error:', data.error);
      return NextResponse.json(data.error, { status: response.status });
    }

    // 3. Extract the base64 audio data from the multimodal response
    const audioBase64 = data.candidates[0].content.parts.find(
      (p: any) => p.inlineData
    )?.inlineData.data;

    return NextResponse.json({ audioContent: audioBase64 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}