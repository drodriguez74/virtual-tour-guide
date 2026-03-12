"use client";

const DESTINATIONS = [
  {
    id: "italy",
    label: "Italy",
    guide: "Marco",
    tagline: "Ancient ruins & Renaissance art",
    emoji: "\u{1f3db}\u{fe0f}",
    gradientFrom: "#ea580c",
    gradientTo: "#b45309",
  },
  {
    id: "greece",
    label: "Greece",
    guide: "Elena",
    tagline: "Gods, philosophers & the Aegean",
    emoji: "\u{1FAD9}",
    gradientFrom: "#2563eb",
    gradientTo: "#0e7490",
  },
  {
    id: "egypt",
    label: "Egypt",
    guide: "Dr. Hassan",
    tagline: "Pyramids, pharaohs & the Nile",
    emoji: "\u{1f3fa}",
    gradientFrom: "#ca8a04",
    gradientTo: "#92400e",
  },
];

interface DestinationSelectorProps {
  selected: string;
  onSelect: (destination: string) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
}

export default function DestinationSelector({
  selected,
  onSelect,
  customValue,
  onCustomChange,
}: DestinationSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/40">
        Where are you exploring?
      </h2>
      <div className="space-y-2">
        {DESTINATIONS.map((dest) => {
          const isSelected = selected === dest.id;
          return (
            <button
              key={dest.id}
              onClick={() => onSelect(dest.id)}
              className={`group relative flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-300 ${
                isSelected
                  ? "glass glow-border"
                  : "glass-light hover:bg-white/[0.08]"
              }`}
            >
              {/* Icon circle */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}
                style={{
                  background: `linear-gradient(135deg, ${dest.gradientFrom}, ${dest.gradientTo})`,
                }}
              >
                <span className="text-xl">{dest.emoji}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold transition-colors ${isSelected ? "text-white" : "text-white/80"}`}
                  >
                    {dest.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {dest.guide}
                  </span>
                </div>
                <p
                  className={`mt-0.5 text-xs transition-colors ${isSelected ? "text-white/50" : "text-white/30"}`}
                >
                  {dest.tagline}
                </p>
              </div>

              {/* Radio dot */}
              <div
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isSelected
                    ? "border-amber-400 bg-amber-500 shadow-md shadow-amber-500/30"
                    : "border-white/20"
                }`}
              >
                {isSelected && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom destination input */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search any place — Machu Picchu, Taj Mahal..."
          value={selected === "custom" ? customValue : ""}
          onFocus={() => onSelect("custom")}
          onChange={(e) => {
            onSelect("custom");
            onCustomChange(e.target.value);
          }}
          className={`w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 ${
            selected === "custom"
              ? "glass glow-border"
              : "glass-light focus:bg-white/[0.08]"
          }`}
        />
      </div>
    </div>
  );
}
