"use client";

import { StoryChapter, Landmark } from "@/lib/landmarks";

interface StorySelectorProps {
  landmark: Landmark;
  onSelectChapter: (chapter: StoryChapter) => void;
  onClose: () => void;
}

export default function StorySelector({
  landmark,
  onSelectChapter,
  onClose,
}: StorySelectorProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
      <div className="rounded-t-3xl bg-stone-900 shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-stone-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <div>
            <h2 className="text-lg font-bold text-amber-400">
              {landmark.name}
            </h2>
            <p className="text-xs text-stone-500">Choose a story to watch</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-400"
          >
            Close
          </button>
        </div>

        {/* Chapter cards */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-6 pb-8 pt-2">
          {landmark.stories.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter)}
              className="flex w-full items-center gap-4 rounded-xl bg-stone-800/80 p-4 text-left transition-colors hover:bg-stone-800"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{chapter.title}</h3>
                <p className="mt-1 text-sm text-stone-400">
                  {chapter.description}
                </p>
              </div>
              <div className="shrink-0 text-2xl text-amber-500">▶</div>
            </button>
          ))}
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
