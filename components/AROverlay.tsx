"use client";

import { useCallback } from "react";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

interface AROverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  historicalImageUrl: string;
  caption?: { place: string; year: string } | null;
  langCode: string;
  opacity: number;
  onOpacityChange: (val: number) => void;
  onSwitchView: () => void;
  onClose: () => void;
}

export default function AROverlay({
  videoRef,
  historicalImageUrl,
  caption,
  langCode,
  opacity,
  onOpacityChange,
  onSwitchView,
  onClose,
}: AROverlayProps) {
  const handleScreenshot = useCallback(() => {
    haptic("medium");
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw live camera frame
    ctx.drawImage(video, 0, 0);

    // Overlay historical image at current opacity
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `heyday-ar-${Date.now()}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.9
      );
    };
    img.src = historicalImageUrl;
  }, [videoRef, opacity, historicalImageUrl]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Historical image overlay — positioned over the camera feed */}
      <img
        src={historicalImageUrl}
        alt={t("alt_historical", langCode)}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity }}
      />

      {/* Top controls */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={() => { haptic("light"); onSwitchView(); }}
          className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-sm"
        >
          {t("side_by_side", langCode)}
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleScreenshot}
            className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
          >
            {t("take_screenshot", langCode)}
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-stone-300 backdrop-blur-sm"
          >
            {t("close", langCode)}
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Caption */}
      {caption && (caption.place || caption.year) && (
        <div className="relative z-10 px-6 pb-2 text-center">
          <div className="inline-block rounded-full bg-black/60 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            {caption.place}
            {caption.place && caption.year && " — "}
            {caption.year && (
              <span className="font-semibold text-amber-400">{caption.year}</span>
            )}
          </div>
        </div>
      )}

      {/* Opacity slider */}
      <div className="relative z-10 px-6 pb-8 pt-2">
        <div className="rounded-2xl bg-black/60 px-5 py-4 backdrop-blur-sm">
          <div className="mb-2 flex justify-between text-xs font-semibold">
            <span className="text-blue-400">{t("present", langCode)}</span>
            <span className="text-stone-400">{t("blend_label", langCode)}</span>
            <span className="text-amber-400">{t("past", langCode)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="ar-slider w-full"
          />
        </div>
      </div>

      <style jsx>{`
        .ar-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #3b82f6, #78716c, #f59e0b);
          outline: none;
        }
        .ar-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        }
        .ar-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
