"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface StoryPlayerProps {
  title: string;
  landmarkName: string;
  narration: string;
  images: string[];
  langCode: string;
  onClose: () => void;
}

export default function StoryPlayer({
  title,
  landmarkName,
  narration,
  images,
  langCode,
  onClose,
}: StoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sentences = narration.split(/(?<=[.!?])\s+/).filter(Boolean);
  const sentencesPerImage = Math.ceil(sentences.length / images.length);

  const getCurrentSubtitle = useCallback(() => {
    const start = currentIndex * sentencesPerImage;
    return sentences.slice(start, start + sentencesPerImage).join(" ");
  }, [currentIndex, sentencesPerImage, sentences]);

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

  // TTS narration via server endpoint (/api/tts)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSpeaking(false);

    const fetchAndPlay = async () => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: narration, languageCode: langCode === "es" ? "es-ES" : "en-US" }),
        });
        if (!res.ok) throw new Error("tts fetch failed");
        const { audioContent } = await res.json();
        const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.play().catch(() => {});
      } catch (e) {
        console.error("StoryPlayer TTS error", e);
      }
    };

    fetchAndPlay();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [narration, langCode]);

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
                i === currentIndex ? "kenburns 8s ease-in-out forwards" : "none",
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
        onClick={() => {
          if (audioRef.current) {
            try {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            } catch {}
          }
          onClose();
        }}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm"
      >
        Close
      </button>

      {/* Subtitle */}
      <div className="absolute inset-x-4 bottom-24 z-10">
        <p className="rounded-lg bg-black/70 px-4 py-3 text-center text-sm leading-relaxed text-white backdrop-blur-sm">
          {getCurrentSubtitle()}
        </p>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-6">
        <button
          onClick={togglePause}
          className="rounded-full bg-white/20 px-6 py-2 text-white backdrop-blur-sm"
        >
          {isPaused ? "▶ Play" : "⏸ Pause"}
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
