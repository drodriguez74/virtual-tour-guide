"use client";

import { useRef, useEffect, useState } from "react";

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
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-stone-900/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3 flex-shrink-0">
        <h2 className="font-semibold text-amber-400">Tour Commentary</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={onToggleTts}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              ttsEnabled
                ? "bg-amber-500/20 text-amber-400"
                : "bg-stone-800 text-stone-500"
            }`}
          >
            {ttsEnabled ? "🔊 TTS On" : "🔇 TTS Off"}
          </button>
          {onNewLocation && (
            <button
              onClick={onNewLocation}
              className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700"
            >
              New Location 📍
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-400 hover:bg-stone-700"
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && !streamingText && (
          <div className="py-12 text-center text-stone-500">
            <p className="text-lg">Point your camera and tap</p>
            <p className="mt-1 text-sm">or ask a question below</p>
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
          placeholder="Ask a question..."
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
