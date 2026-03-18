"use client";

import { useRef, useEffect, useState } from "react";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CommentaryPanelProps {
  messages: Message[];
  isLoading: boolean;
  streamingText: string;
  onSendMessage: (text: string) => void;
  onVoiceInput?: () => void;
  onNewLocation?: () => void;
  isListening?: boolean;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onClose?: () => void;
  langCode: string;
}

export default function CommentaryPanel({
  messages,
  isLoading,
  streamingText,
  onSendMessage,
  onVoiceInput,
  onNewLocation,
  isListening,
  ttsEnabled,
  onToggleTts,
  onClose,
  langCode,
}: CommentaryPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending scroll operations
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Scroll to bottom after DOM updates
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    haptic("light");
    onSendMessage(input.trim());
    setInput("");
  };

  const quickActions = [
    { key: "tell_surprising", send: t("tell_surprising", "en") },
    { key: "what_look_for", send: t("what_look_for", "en") },
    { key: "hidden_details", send: t("hidden_details", "en") },
  ];

  return (
    <div className="flex h-full flex-col bg-stone-900/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3 flex-shrink-0">
        <h2 className="font-semibold text-amber-400">{t("tour_commentary", langCode)}</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { haptic("light"); onToggleTts(); }}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              ttsEnabled
                ? "bg-amber-500/20 text-amber-400"
                : "bg-stone-800 text-stone-500"
            }`}
          >
            {ttsEnabled ? t("tts_on", langCode) : t("tts_off", langCode)}
          </button>
          {onNewLocation && (
            <button
              onClick={onNewLocation}
              className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700"
            >
              {t("new_location", langCode)}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700"
              title={t("close_panel", langCode)}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 relative touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {messages.length === 0 && !streamingText && (
          <div className="py-12 text-center text-stone-500">
            <p className="text-lg">{t("point_camera", langCode)}</p>
            <p className="mt-1 text-sm">{t("or_ask_below", langCode)}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : "rounded-bl-sm bg-stone-800 text-stone-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-stone-800 px-4 py-3 text-sm leading-relaxed text-stone-200">
              <p className="whitespace-pre-wrap">{streamingText}</p>
              <span className="inline-block h-4 w-1 animate-pulse bg-amber-400" />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-stone-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick follow-up buttons */}
        {!isLoading && !streamingText && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickActions.map((qa) => (
              <button
                key={qa.key}
                onClick={() => { haptic("light"); onSendMessage(qa.send); }}
                className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/25"
              >
                {t(qa.key, langCode)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-shrink-0 items-center gap-2 border-t border-stone-800 p-3"
      >
        {onVoiceInput && (
          <button
            type="button"
            onClick={onVoiceInput}
            className={`shrink-0 rounded-full p-2 transition-colors ${
              isListening
                ? "bg-red-500/20 text-red-400"
                : "bg-stone-800 text-stone-400 hover:bg-stone-700"
            }`}
          >
            🎤
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ask_placeholder", langCode)}
          className="flex-1 rounded-full bg-stone-800 px-4 py-2 text-sm text-white placeholder-stone-500 outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 rounded-full bg-amber-500 p-2 text-white transition-colors hover:bg-amber-400 disabled:opacity-40"
        >
          ↑
        </button>
      </form>

      <style jsx>{`
        div[class*='overflow-y-auto'] {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
