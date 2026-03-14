"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { speakWithBrowserTTS, stopBrowserTTS } from "@/lib/browser-tts";
import { t } from "@/lib/translations";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`(.+?)`/g, "$1");
}

interface StoryPlayerProps {
  title: string;
  landmarkName: string;
  narration: string;
  images: string[];
  langCode: string;
  destination: string;
  onClose: () => void;
}

// Six distinct Ken Burns motion directions for variety across scenes
const KB_VARIANTS = [
  "kb-zoom-in-left",    // slow zoom toward top-left
  "kb-zoom-in-right",   // slow zoom toward top-right
  "kb-zoom-out-center", // start zoomed in, pull back to reveal
  "kb-pan-left",        // pan from right to left
  "kb-pan-right",       // pan from left to right
  "kb-zoom-in-bottom",  // slow zoom toward bottom-center
] as const;

export default function StoryPlayer({
  title,
  landmarkName,
  narration,
  images,
  langCode,
  destination,
  onClose,
}: StoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Pre-assign a random KB variant per image slot (stable across renders)
  const kbAssignments = useRef<string[]>(
    images.map((_, i) => KB_VARIANTS[i % KB_VARIANTS.length])
  );

  // Split narration into displayable sentences. Uses the same approach as
  // the TTS chunker so sentence boundaries stay aligned.
  const sentences = (narration.match(/[¿¡]?[^.!?¿¡]*[.!?]+\s*/g) || [narration])
    .map((s) => s.trim())
    .filter(Boolean);
  // Capture any trailing text without terminal punctuation
  const matchedLen = sentences.join(" ").length;
  if (matchedLen < narration.trim().length) {
    const remainder = narration.slice(
      (narration.match(/[¿¡]?[^.!?¿¡]*[.!?]+\s*/g) || []).join("").length
    ).trim();
    if (remainder) sentences.push(remainder);
  }
  const sentencesPerImage = Math.ceil(sentences.length / images.length);

  // Auto-advance images
  useEffect(() => {
    if (isPaused || images.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, images.length]);

  // TTS — fetch streaming audio and play via blob URL
  useEffect(() => {
    if (!narration?.trim()) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Stop previous audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        const oldSrc = audioRef.current.src;
        audioRef.current.src = "";
        audioRef.current.load();
        if (oldSrc.startsWith("blob:")) URL.revokeObjectURL(oldSrc);
      } catch (e) {
        console.warn("[StoryPlayer] Error cleaning up previous audio:", e);
      }
      audioRef.current = null;
    }
    setAudioReady(false);

    const fetchAudio = async () => {
      try {
        const res = await fetch("/api/tts-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: stripMarkdown(narration), destination, langCode }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(`TTS failed: ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        if (controller.signal.aborted) return;

        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        const blobUrl = URL.createObjectURL(blob);

        const audio = new Audio(blobUrl);
        audio.onerror = () => {
          console.error("[StoryPlayer] Audio playback error");
          speakWithBrowserTTS(stripMarkdown(narration), langCode);
          setAudioReady(true);
        };

        audioRef.current = audio;
        setAudioReady(true);
        audio.play().catch((err) =>
          console.warn("[StoryPlayer] Auto-play blocked:", err)
        );
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("[StoryPlayer] TTS error, falling back to browser TTS:", e);
        speakWithBrowserTTS(stripMarkdown(narration), langCode);
        setAudioReady(true);
      }
    };

    fetchAudio();

    return () => {
      controller.abort();
      stopBrowserTTS();
      if (audioRef.current) {
        try {
          const oldSrc = audioRef.current.src;
          audioRef.current.pause();
          audioRef.current.src = "";
          if (oldSrc.startsWith("blob:")) URL.revokeObjectURL(oldSrc);
        } catch (e) {
          console.warn("[StoryPlayer] Cleanup error:", e);
        }
        audioRef.current = null;
      }
    };
  }, [narration, langCode, destination]);

  const togglePause = () => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  const handleShare = async () => {
    const shareData: ShareData = {
      title: `${title} — ${landmarkName}`,
      text: narration.slice(0, 200) + "...",
    };
    // Attach first image as a file if supported
    if (images[0] && navigator.canShare) {
      try {
        const res = await fetch(images[0]);
        const blob = await res.blob();
        const file = new File([blob], "story-scene.png", { type: blob.type });
        const withFile = { ...shareData, files: [file] };
        if (navigator.canShare(withFile)) {
          shareData.files = [file];
        }
      } catch {
        // Skip image attachment on failure
      }
    }
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(
        `${shareData.title}\n\n${narration.slice(0, 300)}...`
      );
    }
  };

  const handleClose = () => {
    stopBrowserTTS();
    if (audioRef.current) {
      try {
        const oldSrc = audioRef.current.src;
        audioRef.current.pause();
        audioRef.current.src = "";
        if (oldSrc.startsWith("blob:")) URL.revokeObjectURL(oldSrc);
      } catch (e) {
        console.warn("[StoryPlayer] Close cleanup error:", e);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Full-screen container — works in both portrait and landscape */}
      <div className="relative h-full w-full">
        {/* Image stage — overflow hidden clips Ken Burns movement */}
        <div className="absolute inset-0 overflow-hidden">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${t("alt_scene", langCode)} ${i + 1}`}
              className={`story-scene absolute inset-0 h-full w-full object-cover ${
                i === currentIndex ? "story-scene-active" : "story-scene-hidden"
              }`}
              style={{
                animationName:
                  i === currentIndex ? kbAssignments.current[i] : "none",
                animationDuration: "10s",
                animationTimingFunction: "ease-in-out",
                animationFillMode: "forwards",
              }}
            />
          ))}

          {/* Cinematic vignette overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
            }}
          />
        </div>

        {/* Title overlay — inside letterbox */}
        <div className="absolute left-4 top-4 z-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 drop-shadow-lg">
            {landmarkName}
          </div>
          <div className="text-sm font-bold text-white drop-shadow-lg">{title}</div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 text-sm text-white backdrop-blur-sm"
        >
          {t("close", langCode)}
        </button>

        {/* Audio loading indicator */}
        {!audioReady && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              {t("generating_audio", langCode)}
            </div>
          </div>
        )}

        {/* Subtitle-style narration — pinned to bottom of letterbox frame */}
        <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center px-4">
          <div className="max-h-32 max-w-2xl overflow-y-auto rounded-lg bg-black/60 px-5 py-3 backdrop-blur-md">
            <div className="space-y-1.5">
              {sentences.map((sentence, idx) => {
                const sectionStart = currentIndex * sentencesPerImage;
                const sectionEnd = sectionStart + sentencesPerImage;
                const isCurrent = idx >= sectionStart && idx < sectionEnd;
                return (
                  <p
                    key={idx}
                    className={`text-sm leading-relaxed transition-all duration-500 ${
                      isCurrent
                        ? "font-semibold text-white"
                        : "text-white/40"
                    }`}
                  >
                    {sentence}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls — inside letterbox at very bottom */}
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-4">
          <button
            onClick={togglePause}
            className="rounded-full bg-white/20 px-5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {isPaused ? t("play", langCode) : t("pause", langCode)}
          </button>
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-700 ${
                  i === currentIndex ? "w-8 bg-amber-400" : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleShare}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            title={t("share", langCode)}
          >
            {t("share", langCode)}
          </button>
        </div>
      </div>

      {/* Ken Burns variants + crossfade transitions */}
      <style jsx>{`
        .story-scene {
          will-change: transform, opacity;
        }
        .story-scene-active {
          opacity: 1;
          transition: opacity 2s ease-in-out;
        }
        .story-scene-hidden {
          opacity: 0;
          transition: opacity 2s ease-in-out;
        }

        @keyframes kb-zoom-in-left {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-3%, -2%); }
        }
        @keyframes kb-zoom-in-right {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(3%, -2%); }
        }
        @keyframes kb-zoom-out-center {
          0%   { transform: scale(1.2) translate(0, 0); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes kb-pan-left {
          0%   { transform: scale(1.1) translate(3%, 0); }
          100% { transform: scale(1.1) translate(-3%, 0); }
        }
        @keyframes kb-pan-right {
          0%   { transform: scale(1.1) translate(-3%, 0); }
          100% { transform: scale(1.1) translate(3%, 0); }
        }
        @keyframes kb-zoom-in-bottom {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(0, 3%); }
        }
      `}</style>
    </div>
  );
}
