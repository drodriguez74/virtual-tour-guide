"use client";

const LANGUAGES = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", label: "Espa\u00f1ol", flag: "\u{1F1EA}\u{1F1F8}" },
];

interface LanguageSelectorProps {
  selected: string;
  onSelect: (langCode: string) => void;
}

export default function LanguageSelector({
  selected,
  onSelect,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/40">
        Commentary language
      </h2>
      <div className="glass-light flex gap-1 rounded-2xl p-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${
              selected === lang.code
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
