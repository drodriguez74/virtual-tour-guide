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
import { findNearbyLandmark, findLandmarksWithinRadius, Landmark, StoryChapter, NearbyLandmarkWithDistance } from "@/lib/landmarks";
import WalkingTour from "@/components/WalkingTour";
import { speakWithBrowserTTS, stopBrowserTTS } from "@/lib/browser-tts";
import { getCachedStory, cacheStory } from "@/lib/story-cache";
import { resizeBase64ForAPI } from "@/lib/image-utils";
import { getCachedHeyday, cacheHeyday } from "@/lib/heyday-cache";
import { trackRequest, estimateBytes, getUsageSummary } from "@/lib/bandwidth-tracker";
import { t, tContent } from "@/lib/translations";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`(.+?)`/g, "$1");
}

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
  const [heyDayCaption, setHeyDayCaption] = useState<{ place: string; year: string } | null>(null);
  const [heyDayLoading, setHeyDayLoading] = useState(false);
  const [showEraPicker, setShowEraPicker] = useState(false);

  // Story
  const [showStorySelector, setShowStorySelector] = useState(false);
  const [storyData, setStoryData] = useState<{
    title: string;
    landmarkName: string;
    narration: string;
    images: string[];
  } | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  // Dynamic story discovery
  const [detectedPlace, setDetectedPlace] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [dynamicLandmark, setDynamicLandmark] = useState<Landmark | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  // Audio guide mode
  const [audioGuideEnabled, setAudioGuideEnabled] = useState(false);
  const lastAutoTriggeredRef = useRef<string | null>(null);

  // Bandwidth tracking
  const [bandwidthTotal, setBandwidthTotal] = useState("");

  // Walking tour
  const [showWalkingTour, setShowWalkingTour] = useState(false);
  const [walkingTourLandmarks, setWalkingTourLandmarks] = useState<NearbyLandmarkWithDistance[]>([]);
  const [visitedLandmarks, setVisitedLandmarks] = useState<Set<string>>(new Set());

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Refresh bandwidth display
  const refreshBandwidth = useCallback(() => {
    setBandwidthTotal(getUsageSummary().total);
  }, []);

  useEffect(() => {
    refreshBandwidth();
  }, [refreshBandwidth]);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    coordsRef.current = { lat, lng };
    const nearby = findNearbyLandmark(lat, lng);
    setNearbyLandmark(nearby);
    // Update walking tour data
    setWalkingTourLandmarks(findLandmarksWithinRadius(lat, lng, 3000));
    // Track visited landmarks
    if (nearby) {
      setVisitedLandmarks((prev) => {
        if (prev.has(nearby.key)) return prev;
        const next = new Set(prev);
        next.add(nearby.key);
        return next;
      });
    }
  }, []);

  const [initialQuerySent, setInitialQuerySent] = useState(false);
  const initialQuerySentRef = useRef(false);

  // TTS helper — uses streaming chunked TTS endpoint for faster playback.
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakText = useCallback(
    async (text: string) => {
      if (!ttsEnabled || typeof window === "undefined") return;

      // Stop any previous browser TTS fallback
      stopBrowserTTS();

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
        console.warn("[TourPage] TTS stream failed, falling back to browser TTS:", err);
        speakWithBrowserTTS(text, langCode);
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
        speakText(stripMarkdown(fullText));

        // Extract place context for dynamic story discovery
        if (fullText.length > 50) {
          const firstParagraph = fullText.split("\n\n")[0] || fullText;
          setDetectedPlace({
            name: firstParagraph.slice(0, 60).replace(/[.!?].*/, "").trim(),
            description: firstParagraph,
          });
        }
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

  // Audio guide — continuous play-by-play narration near landmarks.
  // Triggers immediately on entering a new landmark, then periodically
  // re-narrates (~30s) as the user moves around, using the live camera
  // to describe what they're currently looking at.
  const sendToAPIRef = useRef(sendToAPI);
  sendToAPIRef.current = sendToAPI;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const guideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Unlock audio playback on mobile by playing a silent buffer on user gesture.
  // This is stored so subsequent programmatic play() calls are not blocked.
  const audioUnlockedRef = useRef(false);
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      audioUnlockedRef.current = true;
    } catch { /* ignore */ }
  }, []);

  // Send a guide commentary using the latest camera capture
  const sendGuideCommentary = useCallback(
    (landmark: { key: string; landmark: Landmark }, isFirst: boolean) => {
      if (isLoadingRef.current) return;
      const capture = lastCaptureRef.current;
      const prompt = isFirst
        ? `Tell me about ${landmark.landmark.name}. What am I looking at and what's the history?`
        : `I'm still at ${landmark.landmark.name}, keep the tour going. What else can you tell me about what I'm seeing now? Point out different details, lesser-known facts, or nearby features I should look at.`;
      sendToAPIRef.current(prompt, capture || undefined);
    },
    []
  );

  // Trigger on entering a new landmark + set up periodic re-narration
  useEffect(() => {
    // Clean up any existing interval
    if (guideIntervalRef.current) {
      clearInterval(guideIntervalRef.current);
      guideIntervalRef.current = null;
    }

    if (!audioGuideEnabled || !nearbyLandmark) return;

    // Trigger immediately if this is a new landmark
    if (nearbyLandmark.key !== lastAutoTriggeredRef.current) {
      lastAutoTriggeredRef.current = nearbyLandmark.key;
      sendGuideCommentary(nearbyLandmark, true);
    }

    // Set up periodic re-narration every 30s while guide is on
    guideIntervalRef.current = setInterval(() => {
      if (!isLoadingRef.current && nearbyLandmark) {
        sendGuideCommentary(nearbyLandmark, false);
      }
    }, 30000);

    return () => {
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
        guideIntervalRef.current = null;
      }
    };
  }, [audioGuideEnabled, nearbyLandmark, sendGuideCommentary]);

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

  // Heyday handler — with compression, caching, and bandwidth tracking
  const handleHeyday = useCallback(async (era?: string) => {
    if (!lastCaptureRef.current || heyDayLoading) return;
    setHeyDayLoading(true);
    setShowEraPicker(false);

    const lmKey = nearbyLandmark?.key;

    // Check cache first (only useful when we know the landmark)
    if (lmKey) {
      const cached = await getCachedHeyday(lmKey, era);
      if (cached) {
        setHeyDayImage(cached.imageDataUrl);
        setHeyDayCaption(cached.caption);
        setHeyDayLoading(false);
        return;
      }
    }

    try {
      // Compress image before upload
      const compressed = await resizeBase64ForAPI(lastCaptureRef.current);
      const body = JSON.stringify({
        imageBase64: compressed,
        era,
        landmarkKey: lmKey,
      });

      // Track upload bandwidth
      trackRequest(estimateBytes(body), 0);

      const response = await fetch("/api/heyday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await response.json();

      // Track download bandwidth
      trackRequest(0, estimateBytes(JSON.stringify(data)));
      refreshBandwidth();

      if (data.imageUrl) {
        setHeyDayImage(data.imageUrl);
        setHeyDayCaption(data.caption || null);

        // Cache for known landmarks
        if (lmKey) {
          cacheHeyday(lmKey, data.imageUrl, data.caption || null, era);
        }
      } else {
        console.error("[TourPage] Heyday returned no image:", data);
      }
    } catch (error) {
      console.error("[TourPage] Heyday error:", error);
    } finally {
      setHeyDayLoading(false);
    }
  }, [heyDayLoading, nearbyLandmark, refreshBandwidth]);

  // Story handler — sends camera image + landmark context for perspective-grounded scenes
  const handlePlayStory = useCallback(
    async (chapter: StoryChapter) => {
      if (storyLoading) return;

      // Check IndexedDB cache (keyed by language so en/es don't collide)
      const cacheKey = `${chapter.id}_${langCode}`;
      const cached = await getCachedStory(cacheKey);
      if (cached) {
        setStoryData(cached);
        setShowStorySelector(false);
        return;
      }

      setStoryLoading(true);
      setShowStorySelector(false);

      try {
        // Compress camera image for vantage-point grounding
        let compressed: string | undefined;
        if (lastCaptureRef.current) {
          compressed = await resizeBase64ForAPI(lastCaptureRef.current);
        }

        const body = JSON.stringify({
          storyPrompt: chapter.prompt,
          langCode,
          imageBase64: compressed,
          landmarkKey: nearbyLandmark?.key,
        });

        trackRequest(estimateBytes(body), 0);

        const response = await fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await response.json();

        trackRequest(0, estimateBytes(JSON.stringify(data)));
        refreshBandwidth();

        if (data.narration && data.images?.length > 0) {
          const rawLandmarkName = nearbyLandmark?.landmark.name || dynamicLandmark?.name || "";
          const translatedLandmarkName = nearbyLandmark?.key
            ? tContent(`lm:${nearbyLandmark.key}`, langCode, rawLandmarkName)
            : rawLandmarkName;
          const story = {
            title: tContent(`story:${chapter.id}:title`, langCode, chapter.title),
            landmarkName: translatedLandmarkName,
            narration: data.narration,
            images: data.images,
          };
          cacheStory(cacheKey, story);
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
    [storyLoading, langCode, nearbyLandmark, dynamicLandmark, refreshBandwidth]
  );

  // New location: clear history
  const handleNewLocation = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    setDetectedPlace(null);
    setDynamicLandmark(null);
    window.speechSynthesis?.cancel();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col">
      <OfflineBanner />
      {/* Camera view - top half or full screen */}
      <div className={`relative ${showPanel ? "h-[40vh]" : "h-full"} transition-all duration-300`}>
        <CameraView onCapture={handleCapture} langCode={langCode}>
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
            <LocationBadge onLocationUpdate={handleLocationUpdate} langCode={langCode} />
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unlockAudio();
                  setAudioGuideEnabled((prev) => !prev);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-colors ${
                  audioGuideEnabled
                    ? "bg-green-500/90 text-white"
                    : "bg-stone-800/80 text-stone-300"
                }`}
              >
                {audioGuideEnabled ? t("guide_on", langCode) : t("guide", langCode)}
              </button>
              {walkingTourLandmarks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWalkingTour(true);
                  }}
                  className="rounded-full bg-stone-800/80 px-3 py-1 text-xs font-semibold text-stone-300 backdrop-blur-sm"
                >
                  Tour ({walkingTourLandmarks.length})
                </button>
              )}
              {bandwidthTotal && bandwidthTotal !== "0 B" && (
                <span className="rounded-full bg-stone-800/80 px-3 py-1 text-xs text-stone-400 backdrop-blur-sm">
                  ~{bandwidthTotal}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Stop all audio before navigating away
                  stopBrowserTTS();
                  if (ttsAudioRef.current) {
                    try {
                      ttsAudioRef.current.pause();
                      ttsAudioRef.current.src = "";
                    } catch { /* ignore */ }
                    ttsAudioRef.current = null;
                  }
                  window.speechSynthesis?.cancel();
                  window.location.href = "/";
                }}
                className="rounded-full bg-stone-800/80 px-3 py-1 text-xs text-stone-300 backdrop-blur-sm"
              >
                {t("exit", langCode)}
              </button>
            </div>
          </div>

          {/* Bottom overlay buttons */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-3 px-4">
            {lastCaptureRef.current && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEraPicker((prev) => !prev);
                  }}
                  disabled={heyDayLoading}
                  className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm disabled:opacity-50"
                >
                  {heyDayLoading ? t("generating", langCode) : t("show_in_heyday", langCode)}
                </button>
                {showEraPicker && !heyDayLoading && (
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl bg-stone-900/95 p-2 backdrop-blur-md shadow-xl">
                    <div className="flex flex-col gap-1 whitespace-nowrap">
                      {[
                        { label: t("era_auto", langCode), value: undefined },
                        { label: t("era_ancient", langCode), value: "Ancient era, around 100 AD" },
                        { label: t("era_medieval", langCode), value: "Medieval era, around 1200 AD" },
                        { label: t("era_renaissance", langCode), value: "Renaissance era, around 1500 AD" },
                        { label: t("era_victorian", langCode), value: "Victorian era, around 1880" },
                        { label: t("era_midcentury", langCode), value: "Mid-20th century, around 1950" },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHeyday(opt.value);
                          }}
                          className="rounded-lg px-4 py-2 text-left text-xs text-stone-200 hover:bg-amber-500/20 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(nearbyLandmark || detectedPlace) && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (nearbyLandmark) {
                    setShowStorySelector(true);
                  } else if (dynamicLandmark) {
                    setShowStorySelector(true);
                  } else if (detectedPlace && !discoverLoading) {
                    setDiscoverLoading(true);
                    try {
                      const res = await fetch("/api/discover-stories", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          placeDescription: detectedPlace.description,
                          destination,
                          langCode,
                        }),
                      });
                      const data = await res.json();
                      if (data.placeName && data.stories?.length > 0) {
                        const landmark: Landmark = {
                          name: data.placeName,
                          coords: coordsRef.current,
                          radiusMeters: 0,
                          stories: data.stories,
                        };
                        setDynamicLandmark(landmark);
                        setShowStorySelector(true);
                      }
                    } catch (err) {
                      console.error("[TourPage] Discover stories error:", err);
                    } finally {
                      setDiscoverLoading(false);
                    }
                  }
                }}
                disabled={discoverLoading}
                className="rounded-full bg-purple-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm disabled:opacity-50"
              >
                {discoverLoading ? t("discovering", langCode) : t("watch_the_story", langCode)}
              </button>
            )}
          </div>

          {/* Tap hint */}
          {messages.length === 0 && !isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-full bg-black/50 px-6 py-3 text-sm text-white backdrop-blur-sm">
                {t("tap_anywhere", langCode)}
              </div>
            </div>
          )}

          {/* Story loading indicator */}
          {storyLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
                <p className="text-white">{t("generating_story", langCode)}</p>
                <p className="text-sm text-stone-400">
                  {t("creating_scenes", langCode)}
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
            langCode={langCode}
          />
        </div>
      )}

      {/* Toggle panel button when hidden */}
      {!showPanel && messages.length > 0 && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute right-4 bottom-4 z-20 rounded-full bg-stone-800/90 px-6 py-3 text-sm text-white shadow-lg backdrop-blur-sm hover:bg-stone-700"
        >
          {t("show_commentary", langCode)} ({messages.filter((m) => m.role === "assistant").length})
        </button>
      )}

      {/* Heyday Modal */}
      {heyDayImage && lastCaptureRef.current && (
        <ErrorBoundary fallback={null}>
          <HeyDayModal
            currentImage={lastCaptureRef.current}
            historicalImage={heyDayImage}
            caption={heyDayCaption}
            langCode={langCode}
            onClose={() => {
              setHeyDayImage(null);
              setHeyDayCaption(null);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Walking Tour */}
      {showWalkingTour && (
        <WalkingTour
          landmarks={walkingTourLandmarks}
          visitedKeys={visitedLandmarks}
          currentLandmarkKey={nearbyLandmark?.key || null}
          langCode={langCode}
          onClose={() => setShowWalkingTour(false)}
        />
      )}

      {/* Story Selector */}
      {showStorySelector && (nearbyLandmark || dynamicLandmark) && (
        <StorySelector
          landmark={nearbyLandmark?.landmark || dynamicLandmark!}
          landmarkKey={nearbyLandmark?.key}
          onSelectChapter={handlePlayStory}
          onClose={() => setShowStorySelector(false)}
          langCode={langCode}
        />
      )}

      {/* Story Player */}
      {storyData && (
        <ErrorBoundary fallback={null}>
          <StoryPlayer
            title={storyData.title}
            landmarkName={storyData.landmarkName}
            narration={storyData.narration}
            images={storyData.images}
            langCode={langCode}
            destination={destination}
            onClose={() => {
              setStoryData(null);
              if (nearbyLandmark || dynamicLandmark) {
                setShowStorySelector(true);
              }
            }}
          />
        </ErrorBoundary>
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
      <ErrorBoundary>
        <TourContent />
      </ErrorBoundary>
    </Suspense>
  );
}
