"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import CameraView from "@/components/CameraView";
import CommentaryPanel, { Message } from "@/components/CommentaryPanel";
import LocationBadge from "@/components/LocationBadge";
import HeyDayModal from "@/components/HeyDayModal";
import StorySelector from "@/components/StorySelector";
import StoryPlayer from "@/components/StoryPlayer";
import { findNearbyLandmark, Landmark, StoryChapter } from "@/lib/landmarks";

function TourContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") || "italy";
  const langCode = searchParams.get("lang") || "en";

  // Query overrides for testing
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Location
  const coordsRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [nearbyLandmark, setNearbyLandmark] = useState<{
    key: string;
    landmark: Landmark;
  } | null>(null);

  // Camera capture
  const lastCaptureRef = useRef<string>("");

  // Heyday
  const [heyDayImage, setHeyDayImage] = useState<string | null>(null);
  const [heyDayLoading, setHeyDayLoading] = useState(false);

  // Story
  const [showStorySelector, setShowStorySelector] = useState(false);
  const [storyData, setStoryData] = useState<{
    title: string;
    landmarkName: string;
    narration: string;
    images: string[];
  } | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    coordsRef.current = { lat, lng };
    const nearby = findNearbyLandmark(lat, lng);
    setNearbyLandmark(nearby);
  }, []);

  const [initialQuerySent, setInitialQuerySent] = useState(false);
  const initialQuerySentRef = useRef(false);

  // TTS helper — uses streaming chunked TTS endpoint for faster playback.
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakText = useCallback(
    async (text: string) => {
      if (!ttsEnabled || typeof window === "undefined") return;

      // Stop any previous TTS audio
      if (ttsAudioRef.current) {
        try {
          const oldSrc = ttsAudioRef.current.src;
          ttsAudioRef.current.pause();
          ttsAudioRef.current.src = "";
          if (oldSrc.startsWith("blob:")) URL.revokeObjectURL(oldSrc);
        } catch (e) {
          console.warn("[TourPage] Error cleaning up previous audio:", e);
        }
        ttsAudioRef.current = null;
      }

      try {
        const res = await fetch("/api/tts-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, destination, langCode }),
        });

        if (!res.ok || !res.body) throw new Error(`TTS ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        ttsAudioRef.current = audio;
        audio.play().catch((err) =>
          console.warn("[TourPage] Audio play blocked:", err)
        );
      } catch (err) {
        console.warn("[TourPage] TTS stream failed, no audio:", err);
      }
    },
    [ttsEnabled, langCode, destination]
  );

  // Send message to commentary API
  const sendToAPI = useCallback(
    async (
      userMessage: string,
      imageBase64?: string
    ) => {
      setIsLoading(true);
      setStreamingText("");
      setShowPanel(true);

      const newMessages: Message[] = [
        ...messages,
        { role: "user" as const, content: userMessage },
      ];
      setMessages(newMessages);

      try {
        const response = await fetch("/api/commentary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            imageBase64,
            destination,
            latitude: coordsRef.current.lat,
            longitude: coordsRef.current.lng,
            langCode,
          }),
        });

        if (!response.ok) throw new Error("API error");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamingText(fullText);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullText },
        ]);
        setStreamingText("");
        speakText(fullText);
      } catch (error) {
        console.error("Commentary error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I had trouble generating commentary. Please try again." },
        ]);
        setStreamingText("");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, destination, langCode, speakText]
  );

  // If the URL provides explicit coordinates (for testing), apply them once and
  // optionally send an automatic "What am I looking at?" query so the user
  // doesn’t need to tap or type anything.
  useEffect(() => {
    if (latParam && lngParam && !initialQuerySentRef.current) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        handleLocationUpdate(lat, lng);
        initialQuerySentRef.current = true;
        // Use a timeout to ensure sendToAPI is called after state updates
        setTimeout(() => {
          sendToAPI("What am I looking at? Tell me about this place.");
        }, 0);
      }
    }
  }, [latParam, lngParam, handleLocationUpdate, sendToAPI]);

  // Camera capture handler
  const handleCapture = useCallback(
    (base64: string) => {
      if (isLoading) return;
      lastCaptureRef.current = base64;
      sendToAPI("What am I looking at? Tell me about this place.", base64);
    },
    [isLoading, sendToAPI]
  );

  // Text message handler
  const handleSendMessage = useCallback(
    (text: string) => {
      sendToAPI(text);
    },
    [sendToAPI]
  );

  // Voice input
  const handleVoiceInput = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCode === "es" ? "es-ES" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        sendToAPI(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, langCode, sendToAPI]);

  // Heyday handler
  const handleHeyday = useCallback(async () => {
    if (!lastCaptureRef.current || heyDayLoading) return;
    setHeyDayLoading(true);
    try {
      const response = await fetch("/api/heyday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: lastCaptureRef.current }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        setHeyDayImage(data.imageUrl);
      } else {
        console.error("[TourPage] Heyday returned no image:", data);
      }
    } catch (error) {
      console.error("[TourPage] Heyday error:", error);
    } finally {
      setHeyDayLoading(false);
    }
  }, [heyDayLoading]);

  // Story handler
  const handlePlayStory = useCallback(
    async (chapter: StoryChapter) => {
      if (storyLoading) return;

      // Check sessionStorage cache
      const cacheKey = `story_${chapter.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setStoryData(JSON.parse(cached));
        setShowStorySelector(false);
        return;
      }

      setStoryLoading(true);
      setShowStorySelector(false);

      try {
        const response = await fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyPrompt: chapter.prompt,
            langCode,
          }),
        });
        const data = await response.json();
        if (data.narration && data.images?.length > 0) {
          const story = {
            title: chapter.title,
            landmarkName: nearbyLandmark?.landmark.name || "",
            narration: data.narration,
            images: data.images,
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(story));
          setStoryData(story);
        } else {
          console.error("[TourPage] Story returned incomplete data:", data);
        }
      } catch (error) {
        console.error("[TourPage] Story error:", error);
      } finally {
        setStoryLoading(false);
      }
    },
    [storyLoading, langCode, nearbyLandmark]
  );

  // New location: clear history
  const handleNewLocation = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    window.speechSynthesis?.cancel();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Camera view - top half or full screen */}
      <div className={`relative ${showPanel ? "h-[40vh]" : "h-full"} transition-all duration-300`}>
        <CameraView onCapture={handleCapture}>
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
            <LocationBadge onLocationUpdate={handleLocationUpdate} />
            <a
              href="/"
              className="rounded-full bg-stone-800/80 px-3 py-1 text-xs text-stone-300 backdrop-blur-sm"
            >
              Exit
            </a>
          </div>

          {/* Bottom overlay buttons */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-3 px-4">
            {lastCaptureRef.current && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHeyday();
                }}
                disabled={heyDayLoading}
                className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm disabled:opacity-50"
              >
                {heyDayLoading ? "Generating..." : "Show in its Heyday"}
              </button>
            )}

            {nearbyLandmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStorySelector(true);
                }}
                className="rounded-full bg-purple-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
              >
                Watch the Story
              </button>
            )}
          </div>

          {/* Tap hint */}
          {messages.length === 0 && !isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-full bg-black/50 px-6 py-3 text-sm text-white backdrop-blur-sm">
                Tap anywhere to get commentary
              </div>
            </div>
          )}

          {/* Story loading indicator */}
          {storyLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
                <p className="text-white">Generating your story...</p>
                <p className="text-sm text-stone-400">
                  Creating scenes & narration
                </p>
              </div>
            </div>
          )}
        </CameraView>
      </div>

      {/* Commentary panel - bottom section */}
      {showPanel && (
        <div className="flex-1 h-full min-h-0">
          <CommentaryPanel
            messages={messages}
            isLoading={isLoading}
            streamingText={streamingText}
            onSendMessage={handleSendMessage}
            onVoiceInput={handleVoiceInput}
            isListening={isListening}
            onNewLocation={handleNewLocation}
            ttsEnabled={ttsEnabled}
            onToggleTts={() => setTtsEnabled(!ttsEnabled)}
            onClose={() => setShowPanel(false)}
          />
        </div>
      )}

      {/* Toggle panel button when hidden */}
      {!showPanel && messages.length > 0 && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute right-4 bottom-4 z-20 rounded-full bg-stone-800/90 px-6 py-3 text-sm text-white shadow-lg backdrop-blur-sm hover:bg-stone-700"
        >
          Show Commentary ({messages.filter((m) => m.role === "assistant").length})
        </button>
      )}

      {/* Heyday Modal */}
      {heyDayImage && lastCaptureRef.current && (
        <HeyDayModal
          currentImage={lastCaptureRef.current}
          historicalImage={heyDayImage}
          onClose={() => setHeyDayImage(null)}
        />
      )}

      {/* Story Selector */}
      {showStorySelector && nearbyLandmark && (
        <StorySelector
          landmark={nearbyLandmark.landmark}
          onSelectChapter={handlePlayStory}
          onClose={() => setShowStorySelector(false)}
        />
      )}

      {/* Story Player */}
      {storyData && (
        <StoryPlayer
          title={storyData.title}
          landmarkName={storyData.landmarkName}
          narration={storyData.narration}
          images={storyData.images}
          langCode={langCode}
          destination={destination}
          onClose={() => setStoryData(null)}
        />
      )}
    </div>
  );
}

export default function TourPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <TourContent />
    </Suspense>
  );
}
