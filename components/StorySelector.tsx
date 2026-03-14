"use client";

import { useState } from "react";
import { StoryChapter, Landmark } from "@/lib/landmarks";
import { t, tContent } from "@/lib/translations";

interface StorySelectorProps {
  landmark: Landmark;
  landmarkKey?: string;
  onSelectChapter: (chapter: StoryChapter) => void;
  onClose: () => void;
  langCode: string;
}

export default function StorySelector({
  landmark,
  landmarkKey,
  onSelectChapter,
  onClose,
  langCode,
}: StorySelectorProps) {
  const [customTopic, setCustomTopic] = useState("");

  const handleCustomStory = () => {
    if (!customTopic.trim()) return;
    const customChapter: StoryChapter = {
      id: `custom_${Date.now()}`,
      title: customTopic.trim(),
      description: "Custom story request",
      prompt: `Create a vivid cinematic narration about "${customTopic.trim()}" in the context of ${landmark.name}. Make it historically accurate, dramatic, and engaging — like a BBC documentary. Cover the most fascinating and lesser-known details. About 200 words.`,
    };
    onSelectChapter(customChapter);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative rounded-t-3xl bg-stone-900 shadow-2xl">
        {/* Handle bar */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-stone-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <div>
            <h2 className="text-lg font-bold text-amber-400">
              {landmarkKey ? tContent(`lm:${landmarkKey}`, langCode, landmark.name) : landmark.name}
            </h2>
            <p className="text-xs text-stone-500">{t("choose_story", langCode)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-400"
          >
            {t("close", langCode)}
          </button>
        </div>

        {/* Chapter cards */}
        <div className="scrollbar-hide max-h-[50vh] space-y-3 overflow-y-auto px-6 pb-4 pt-2">
          {landmark.stories.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter)}
              className="flex w-full items-center gap-4 rounded-xl bg-stone-800/80 p-4 text-left transition-colors hover:bg-stone-800"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{tContent(`story:${chapter.id}:title`, langCode, chapter.title)}</h3>
                <p className="mt-1 text-sm text-stone-400">
                  {tContent(`story:${chapter.id}:desc`, langCode, chapter.description)}
                </p>
              </div>
              <div className="shrink-0 text-2xl text-amber-500">&#9654;</div>
            </button>
          ))}
        </div>

        {/* Custom story request */}
        <div className="border-t border-stone-800 px-6 pb-8 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            {t("request_custom", langCode)}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomStory()}
              placeholder={t("custom_placeholder", langCode)}
              className="flex-1 rounded-xl bg-stone-800 px-4 py-2.5 text-sm text-white placeholder-stone-500 outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleCustomStory}
              disabled={!customTopic.trim()}
              className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              {t("go", langCode)}
            </button>
          </div>
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
