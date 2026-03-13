"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { speakWithBrowserTTS, stopBrowserTTS } from "@/lib/browser-tts";

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
      {/* Images with Ken Burns effect */}
      <div className="relative h-full w-full overflow-hidden">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Scene ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              animation:
                i === currentIndex
                  ? "kenburns 8s ease-in-out forwards"
                  : "none",
            }}
          />
        ))}
      </div>

      {/* Title overlay */}
      <div className="absolute left-4 top-4 z-10">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          {landmarkName}
        </div>
        <div className="text-sm font-bold text-white">{title}</div>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 text-sm text-white backdrop-blur-sm"
      >
        Close
      </button>

      {/* Audio loading indicator */}
      {!audioReady && (
        <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            Generating audio...
          </div>
        </div>
      )}

      {/* Scrollable Narration Text */}
      <div className="absolute inset-x-4 bottom-24 z-10 max-h-48 overflow-y-auto rounded-lg bg-black/40 px-4 py-3 backdrop-blur-sm">
        <div className="space-y-2">
          {sentences.map((sentence, idx) => {
            const sectionStart = currentIndex * sentencesPerImage;
            const sectionEnd = sectionStart + sentencesPerImage;
            const isCurrent = idx >= sectionStart && idx < sectionEnd;
            return (
              <p
                key={idx}
                className={`text-sm leading-relaxed transition-colors ${
                  isCurrent
                    ? "rounded bg-amber-500/20 px-2 py-1 font-semibold text-amber-100"
                    : "text-white/70"
                }`}
              >
                {sentence}
              </p>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-4">
        <button
          onClick={togglePause}
          className="rounded-full bg-white/20 px-6 py-2 text-white backdrop-blur-sm"
        >
          {isPaused ? "\u25b6 Play" : "\u23f8 Pause"}
        </button>
        <div className="flex gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i === currentIndex ? "bg-amber-400" : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleShare}
          className="rounded-full bg-white/20 px-4 py-2 text-white backdrop-blur-sm"
          title="Share this story"
        >
          Share
        </button>
      </div>

      <style jsx>{`
        @keyframes kenburns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.1) translate(-2%, -1%);
          }
        }
      `}</style>
    </div>
  );
}
