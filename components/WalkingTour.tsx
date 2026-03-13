"use client";

import {
  NearbyLandmarkWithDistance,
  bearingToDirection,
  formatDistance,
} from "@/lib/landmarks";

interface WalkingTourProps {
  landmarks: NearbyLandmarkWithDistance[];
  visitedKeys: Set<string>;
  currentLandmarkKey: string | null;
  onClose: () => void;
}

export default function WalkingTour({
  landmarks,
  visitedKeys,
  currentLandmarkKey,
  onClose,
}: WalkingTourProps) {
  const walkingMinutes = (meters: number) => Math.max(1, Math.round(meters / 80));

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative rounded-t-3xl bg-stone-900 shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-stone-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <div>
            <h2 className="text-lg font-bold text-amber-400">Walking Tour</h2>
            <p className="text-xs text-stone-500">
              {landmarks.length} landmark{landmarks.length !== 1 ? "s" : ""} nearby
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-400"
          >
            Close
          </button>
        </div>

        {/* Tour stops */}
        <div className="scrollbar-hide max-h-[50vh] space-y-2 overflow-y-auto px-6 pb-6 pt-2">
          {landmarks.map((item, idx) => {
            const isVisited = visitedKeys.has(item.key);
            const isCurrent = item.key === currentLandmarkKey;
            const isNext =
              !isCurrent &&
              !isVisited &&
              !landmarks
                .slice(0, idx)
                .some((prev) => !visitedKeys.has(prev.key) && prev.key !== currentLandmarkKey);

            return (
              <div
                key={item.key}
                className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                  isCurrent
                    ? "bg-amber-500/20 ring-1 ring-amber-500/40"
                    : isNext
                    ? "bg-green-500/10 ring-1 ring-green-500/30"
                    : isVisited
                    ? "bg-stone-800/40 opacity-60"
                    : "bg-stone-800/80"
                }`}
              >
                {/* Step number */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent
                      ? "bg-amber-500 text-white"
                      : isVisited
                      ? "bg-stone-600 text-stone-400 line-through"
                      : isNext
                      ? "bg-green-500 text-white"
                      : "bg-stone-700 text-stone-300"
                  }`}
                >
                  {isVisited ? "\u2713" : idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold truncate ${
                      isCurrent ? "text-amber-300" : isVisited ? "text-stone-500" : "text-white"
                    }`}
                  >
                    {item.landmark.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {item.landmark.stories.length} stor{item.landmark.stories.length !== 1 ? "ies" : "y"}
                  </p>
                </div>

                {/* Distance / direction */}
                <div className="shrink-0 text-right">
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-amber-400">You are here</span>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-stone-200">
                        {formatDistance(item.distanceMeters)}
                      </div>
                      <div className="text-xs text-stone-500">
                        {bearingToDirection(item.bearing)} &middot; ~{walkingMinutes(item.distanceMeters)} min
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
