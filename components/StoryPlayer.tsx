"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { speakWithBrowserTTS, stopBrowserTTS } from "@/lib/browser-tts";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    if (images.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= images.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        haptic("heavy");
        return prev + 1;
      });
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images.length]);

  // Clean up browser TTS on unmount
  useEffect(() => {
    return () => {
      stopBrowserTTS();
    };
  }, []);

  const toggleNarration = useCallback(() => {
    haptic("light");
    if (isSpeaking) {
      stopBrowserTTS();
      setIsSpeaking(false);
      return;
    }
    stopBrowserTTS();
    const utterance = speakWithBrowserTTS(stripMarkdown(narration), langCode);
    if (utterance) {
      utteranceRef.current = utterance;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
  }, [isSpeaking, narration, langCode]);

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
            onClick={toggleNarration}
            className={`rounded-full px-5 py-1.5 text-sm backdrop-blur-sm transition-colors ${
              isSpeaking
                ? "bg-red-500/30 text-red-300 hover:bg-red-500/40"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {isSpeaking ? t("stop_reading", langCode) : t("read_aloud", langCode)}
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
