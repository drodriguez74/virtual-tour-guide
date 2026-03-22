"use client";

import { useMemo, useState } from "react";
import { getTripStats } from "@/lib/trip-tracker";
import { getTotalPossibleScore, getScore } from "@/lib/scavenger-hunt";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

interface TripScorecardProps {
  langCode: string;
  onClose: () => void;
  onReset: () => void;
}

function ProgressRing({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-stone-700"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {value}
            {max > 0 && <span className="text-xs text-stone-400">/{max}</span>}
          </span>
        </div>
      </div>
      <span className="text-xs text-stone-400 text-center leading-tight">{label}</span>
    </div>
  );
}

interface Badge {
  key: string;
  icon: string;
  unlocked: boolean;
}

export default function TripScorecard({ langCode, onClose, onReset }: TripScorecardProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const stats = useMemo(() => getTripStats(), []);
  const scavengerScore = useMemo(() => getScore(), []);
  const totalPossible = useMemo(() => getTotalPossibleScore(), []);

  const daysSinceStart = useMemo(() => {
    if (!stats.startedAt) return 0;
    const start = new Date(stats.startedAt);
    const now = new Date();
    return Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [stats.startedAt]);

  const badges: Badge[] = useMemo(
    () => [
      { key: "achievement_explorer", icon: "🧭", unlocked: stats.landmarksVisited.length >= 5 },
      { key: "achievement_historian", icon: "📜", unlocked: stats.storiesWatched.length >= 10 },
      { key: "achievement_time_traveler", icon: "⏳", unlocked: stats.heydayPhotos >= 5 },
      { key: "achievement_detective", icon: "🔍", unlocked: scavengerScore >= 15 },
      { key: "achievement_photographer", icon: "📸", unlocked: stats.photosTaken >= 10 },
    ],
    [stats, scavengerScore]
  );

  const handleShare = async () => {
    haptic("medium");
    const text = [
      `${t("your_trip", langCode)} — ${daysSinceStart} ${t("days_exploring", langCode)}`,
      `${t("landmarks_visited", langCode)}: ${stats.landmarksVisited.length}`,
      `${t("stories_watched", langCode)}: ${stats.storiesWatched.length}`,
      `${t("photos_taken", langCode)}: ${stats.photosTaken}`,
      `${t("score", langCode)}: ${scavengerScore}/${totalPossible}`,
      badges
        .filter((b) => b.unlocked)
        .map((b) => `${b.icon} ${t(b.key, langCode)}`)
        .join(", "),
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleReset = () => {
    haptic("heavy");
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md animate-slide-up rounded-t-2xl bg-stone-900 p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t("your_trip", langCode)}</h2>
            <p className="text-xs text-stone-400">
              {daysSinceStart} {t("days_exploring", langCode)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400"
          >
            {t("close", langCode)}
          </button>
        </div>

        {/* Progress Rings */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          <ProgressRing
            value={stats.landmarksVisited.length}
            max={20}
            label={t("landmarks_visited", langCode)}
            color="#f59e0b"
          />
          <ProgressRing
            value={stats.storiesWatched.length}
            max={0}
            label={t("stories_watched", langCode)}
            color="#a855f7"
          />
          <ProgressRing
            value={stats.heydayPhotos}
            max={0}
            label={t("heyday_photos", langCode)}
            color="#3b82f6"
          />
          <ProgressRing
            value={scavengerScore}
            max={totalPossible}
            label={t("scavenger_finds", langCode)}
            color="#10b981"
          />
        </div>

        {/* Fun Stats */}
        <div className="mb-6 flex justify-center gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-white">{stats.photosTaken}</p>
            <p className="text-xs text-stone-400">{t("photos_taken", langCode)}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{daysSinceStart}</p>
            <p className="text-xs text-stone-400">{t("days_exploring", langCode)}</p>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            {badges.map((badge) => (
              <div
                key={badge.key}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-center ${
                  badge.unlocked ? "bg-amber-500/10" : "bg-stone-800 opacity-40"
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-[10px] leading-tight text-stone-300 max-w-[60px]">
                  {t(badge.key, langCode)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 rounded-full bg-amber-500 py-2.5 text-sm font-semibold text-white"
          >
            {t("share_trip", langCode)}
          </button>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="rounded-full bg-stone-800 px-4 py-2.5 text-sm text-stone-400"
            >
              {t("reset_trip", langCode)}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="rounded-full bg-red-500/80 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("reset_confirm", langCode)}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
