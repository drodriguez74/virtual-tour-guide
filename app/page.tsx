"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DestinationSelector from "@/components/DestinationSelector";
import LanguageSelector from "@/components/LanguageSelector";

const BACKGROUND_IMAGES: Record<string, string> = {
  italy: "/backgrounds/italy.jpg",
  greece: "/backgrounds/greece.jpg",
  egypt: "/backgrounds/egypt.jpg",
  custom: "/backgrounds/default.jpg",
};

const ALL_BG_KEYS = Object.keys(BACKGROUND_IMAGES);

export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState("italy");
  const [customDestination, setCustomDestination] = useState("");
  const [langCode, setLangCode] = useState("en");

  const activeBg = useMemo(
    () => BACKGROUND_IMAGES[destination] || BACKGROUND_IMAGES.custom,
    [destination]
  );

  const handleStartTour = () => {
    const dest =
      destination === "custom" ? customDestination.trim() : destination;
    if (!dest) return;
    router.push(
      `/tour?destination=${encodeURIComponent(dest)}&lang=${langCode}`
    );
  };

  const isReady =
    destination !== "custom" ||
    (destination === "custom" && customDestination.trim().length > 0);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* ── Background images with crossfade ── */}
      <div className="absolute inset-0">
        {ALL_BG_KEYS.map((key) => (
          <div
            key={key}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity:
                (BACKGROUND_IMAGES[key] === activeBg) ? 1 : 0,
            }}
          >
            <Image
              src={BACKGROUND_IMAGES[key]}
              alt=""
              fill
              className="object-cover"
              priority={key === "italy"}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Dark overlay with warm tint */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Warm color overlay */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30,15,5,0.6) 0%, rgba(20,10,5,0.4) 40%, rgba(15,8,3,0.8) 100%)",
          }}
        />

        {/* Bottom fade to solid dark */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0d0806] via-[#0d0806]/80 to-transparent" />

        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="scrollbar-hide relative z-10 flex w-full max-w-md flex-col items-center overflow-y-auto px-6 pb-12 pt-14">
        {/* ── Hero ── */}
        <div className="animate-fade-up text-center">
          {/* Compass / globe icon */}
          <div className="animate-glow mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight sm:text-5xl">
            <span className="text-white">Virtual </span>
            <span className="animate-gradient bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text italic text-transparent">
              Tour
            </span>
            <span className="text-white"> Guide</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-3.5 max-w-[280px] text-[13px] leading-relaxed text-white/50">
            Point your camera at any landmark and get instant AI-powered
            historical commentary
          </p>

          {/* Feature pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {[
              { label: "Live Camera", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
              { label: "GPS", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
              { label: "Voice Q&A", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
              { label: "Historical AI", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
            ].map((feat) => (
              <span
                key={feat.label}
                className="glass-light flex items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                <svg
                  className="h-3 w-3 text-amber-400/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={feat.icon}
                  />
                </svg>
                <span className="text-[10px] font-medium text-white/50">
                  {feat.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Selectors ── */}
        <div className="animate-fade-up delay-200 mt-9 w-full space-y-6">
          <DestinationSelector
            selected={destination}
            onSelect={setDestination}
            customValue={customDestination}
            onCustomChange={setCustomDestination}
          />

          <LanguageSelector selected={langCode} onSelect={setLangCode} />
        </div>

        {/* ── CTA Button ── */}
        <div className="animate-fade-up delay-400 mt-8 w-full">
          <button
            onClick={handleStartTour}
            disabled={!isReady}
            className="group relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            style={{
              background:
                "linear-gradient(135deg, #f59e0b 0%, #ea580c 40%, #db2777 100%)",
            }}
          >
            {/* Shimmer overlay */}
            <div
              className="animate-shimmer absolute inset-0 opacity-30"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Tour
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </button>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] text-white/25">
            Camera & location access required. No app install needed.
          </p>

          {/* Decorative sparkles */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <svg
              className="animate-sparkle h-3 w-3 text-amber-500/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
            <svg
              className="animate-sparkle-delayed h-4 w-4 text-amber-400/40"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
            <svg
              className="animate-sparkle h-3 w-3 text-amber-500/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
