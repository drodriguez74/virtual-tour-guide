"use client";

import { useState, useMemo, useCallback } from "react";
import {
  getChallengesForLandmark,
  getAllChallenges,
  getCompleted,
  markCompleted,
  getScore,
  getTotalPossibleScore,
  getLandmarkKeysWithChallenges,
  Challenge,
} from "@/lib/scavenger-hunt";
import { incrementStat } from "@/lib/trip-tracker";
import { t, tContent } from "@/lib/translations";
import { haptic } from "@/lib/haptics";
import { LANDMARK_STORIES } from "@/lib/landmarks";

interface ScavengerHuntProps {
  nearbyLandmarkKey: string | null;
  langCode: string;
  onClose: () => void;
}

function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" onAnimationEnd={onDone}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece absolute"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.3}s`,
            backgroundColor: ["#f59e0b", "#a855f7", "#10b981", "#3b82f6", "#ef4444", "#ec4899"][i % 6],
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: confetti-fall 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function ScavengerHunt({ nearbyLandmarkKey, langCode, onClose }: ScavengerHuntProps) {
  const [completed, setCompleted] = useState(() => getCompleted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<"dashboard" | "hunt">(
    nearbyLandmarkKey ? "hunt" : "dashboard"
  );
  const [activeLandmark, setActiveLandmark] = useState<string | null>(nearbyLandmarkKey);

  const score = useMemo(() => getScore(), [completed]);
  const totalPossible = useMemo(() => getTotalPossibleScore(), []);
  const landmarkKeys = useMemo(() => getLandmarkKeysWithChallenges(), []);

  const activeChallenges = useMemo(
    () => (activeLandmark ? getChallengesForLandmark(activeLandmark) : []),
    [activeLandmark]
  );

  const handleFoundIt = useCallback(
    (challenge: Challenge) => {
      haptic("heavy");
      markCompleted(challenge.id);
      incrementStat("scavengerFinds");
      setCompleted(getCompleted());
      setShowConfetti(true);
    },
    []
  );

  const toggleHint = useCallback((id: string) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openLandmarkHunt = useCallback((key: string) => {
    setActiveLandmark(key);
    setActiveView("hunt");
  }, []);

  const getLandmarkName = (key: string): string => {
    const lm = LANDMARK_STORIES[key];
    return lm ? tContent(`lm:${key}`, langCode, lm.name) : key;
  };

  const getLandmarkCompletion = (key: string): { done: number; total: number } => {
    const challenges = getChallengesForLandmark(key);
    const done = challenges.filter((c) => completed.has(c.id)).length;
    return { done, total: challenges.length };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative flex w-full max-w-md flex-col rounded-t-2xl bg-stone-900 animate-slide-up"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {showConfetti && <ConfettiOverlay onDone={() => setShowConfetti(false)} />}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeView === "hunt" && (
              <button
                onClick={() => setActiveView("dashboard")}
                className="text-stone-400 text-sm"
              >
                &larr;
              </button>
            )}
            <h2 className="font-bold text-white">{t("scavenger_hunt", langCode)}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-amber-400">
              {score}/{totalPossible} {t("points", langCode)}
            </span>
            <button
              onClick={onClose}
              className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400"
            >
              {t("close", langCode)}
            </button>
          </div>
        </div>

        {/* Score bar */}
        <div className="mx-4 mt-3 mb-2 flex-shrink-0">
          <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${totalPossible > 0 ? (score / totalPossible) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeView === "dashboard" ? (
            <div className="space-y-2">
              {landmarkKeys.map((key) => {
                const { done, total } = getLandmarkCompletion(key);
                return (
                  <button
                    key={key}
                    onClick={() => openLandmarkHunt(key)}
                    className="flex w-full items-center justify-between rounded-xl bg-stone-800 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {done === total ? "✅" : "🔍"}
                      </span>
                      <span className="text-sm text-white">{getLandmarkName(key)}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        done === total ? "text-green-400" : "text-stone-400"
                      }`}
                    >
                      {done}/{total}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {activeLandmark && (
                <h3 className="text-sm font-semibold text-amber-400 mb-3">
                  {getLandmarkName(activeLandmark)}
                </h3>
              )}
              {activeChallenges.map((challenge) => {
                const isDone = completed.has(challenge.id);
                const hintVisible = revealedHints.has(challenge.id);
                const promptText = challenge.prompt[langCode as "en" | "es"] || challenge.prompt.en;
                const hintText = challenge.hint[langCode as "en" | "es"] || challenge.hint.en;

                return (
                  <div
                    key={challenge.id}
                    className={`rounded-xl p-4 ${
                      isDone ? "bg-green-500/10 border border-green-500/20" : "bg-stone-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white flex-1">{promptText}</p>
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                        {challenge.points} {t("points", langCode)}
                      </span>
                    </div>

                    {!isDone && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => toggleHint(challenge.id)}
                          className="rounded-full bg-stone-700 px-3 py-1 text-xs text-stone-300"
                        >
                          {hintVisible ? t("hint", langCode) : t("show_hint", langCode)}
                        </button>
                        <button
                          onClick={() => handleFoundIt(challenge)}
                          className="rounded-full bg-green-500 px-4 py-1 text-xs font-semibold text-white"
                        >
                          {t("found_it", langCode)}
                        </button>
                      </div>
                    )}

                    {hintVisible && !isDone && (
                      <p className="mt-2 text-xs text-stone-400 italic">{hintText}</p>
                    )}

                    {isDone && (
                      <p className="mt-2 text-xs text-green-400">{t("completed", langCode)} ✓</p>
                    )}
                  </div>
                );
              })}

              {activeChallenges.length === 0 && (
                <p className="text-center text-sm text-stone-500 py-8">
                  {t("no_challenges", langCode)}
                </p>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
