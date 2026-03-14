"use client";

import { t } from "@/lib/translations";

interface HeyDayModalProps {
  currentImage: string;
  historicalImage: string;
  caption?: { place: string; year: string } | null;
  langCode: string;
  onClose: () => void;
}

export default function HeyDayModal({
  currentImage,
  historicalImage,
  caption,
  langCode,
  onClose,
}: HeyDayModalProps) {
  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = historicalImage;
    link.download = "heyday-reconstruction.png";
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold text-amber-400">{t("then_vs_now", langCode)}</h2>
        <button
          onClick={onClose}
          className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-300"
        >
          {t("close", langCode)}
        </button>
      </div>

      {/* Side by side images */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4 md:flex-row">
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {t("today", langCode)}
          </span>
          <img
            src={`data:image/jpeg;base64,${currentImage}`}
            alt={t("alt_current_view", langCode)}
            className="max-h-full rounded-lg object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            {t("in_its_heyday", langCode)}
          </span>
          <img
            src={historicalImage}
            alt={t("alt_historical", langCode)}
            className="max-h-full rounded-lg object-contain"
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
