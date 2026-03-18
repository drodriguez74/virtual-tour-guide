"use client";

import { useState } from "react";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";
import AROverlay from "@/components/AROverlay";

interface HeyDayModalProps {
  currentImage: string;
  historicalImage: string;
  caption?: { place: string; year: string } | null;
  langCode: string;
  onClose: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onARModeChange?: (active: boolean) => void;
}

export default function HeyDayModal({
  currentImage,
  historicalImage,
  caption,
  langCode,
  onClose,
  videoRef,
  onARModeChange,
}: HeyDayModalProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "ar-overlay">("side-by-side");
  const [arOpacity, setArOpacity] = useState(0.5);

  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = historicalImage;
    link.download = "heyday-reconstruction.png";
    link.target = "_blank";
    link.click();
  };

  const switchToAR = () => {
    haptic("medium");
    setViewMode("ar-overlay");
    onARModeChange?.(true);
  };

  const switchToSideBySide = () => {
    haptic("light");
    setViewMode("side-by-side");
    onARModeChange?.(false);
  };

  const handleClose = () => {
    onARModeChange?.(false);
    onClose();
  };

  // AR Overlay mode — renders over the live camera feed
  if (viewMode === "ar-overlay" && videoRef) {
    return (
      <AROverlay
        videoRef={videoRef}
        historicalImageUrl={historicalImage}
        caption={caption}
        langCode={langCode}
        opacity={arOpacity}
        onOpacityChange={setArOpacity}
        onSwitchView={switchToSideBySide}
        onClose={handleClose}
      />
    );
  }

  // Side-by-side mode (default)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold text-amber-400">{t("then_vs_now", langCode)}</h2>
        <div className="flex gap-2">
          {videoRef && (
            <button
              onClick={switchToAR}
              className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-400"
            >
              {t("ar_view", langCode)}
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-300"
          >
            {t("close", langCode)}
          </button>
        </div>
      </div>

      {/* Side by side images */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4 md:flex-row md:overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {t("today", langCode)}
          </span>
          <img
            src={`data:image/jpeg;base64,${currentImage}`}
            alt={t("alt_current_view", langCode)}
            className="max-h-[40vh] rounded-lg object-contain md:max-h-full"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            {t("in_its_heyday", langCode)}
          </span>
          <img
            src={historicalImage}
            alt={t("alt_historical", langCode)}
            className="max-h-[40vh] rounded-lg object-contain md:max-h-full"
          />
          {caption && (caption.place || caption.year) && (
            <p className="text-center text-sm text-stone-300">
              {caption.place}
              {caption.place && caption.year && " — "}
              {caption.year && (
                <span className="font-semibold text-amber-400">
                  {caption.year}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <button
          onClick={handleDownload}
          className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white"
        >
          {t("download_historical", langCode)}
        </button>
      </div>
    </div>
  );
}
