"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { incrementStat } from "@/lib/trip-tracker";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

interface PhotoBoothProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarkName: string;
  destination: string;
  langCode: string;
  onClose: () => void;
  /** Pre-loaded DALL-E frame images keyed by frame style */
  dalleFrames?: Record<string, string>;
}

type FrameStyle = "vintage" | "polaroid" | "film" | "golden" | "stamp" | "poster";

interface FrameDef {
  key: FrameStyle;
  labelKey: string;
  fallbackDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, landmarkName: string, destination: string) => void;
  filter?: string;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "center") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

const FRAMES: FrameDef[] = [
  {
    key: "vintage",
    labelKey: "frame_vintage",
    filter: "sepia(0.6) contrast(1.1)",
    fallbackDraw: (ctx, w, h, _lm, destination) => {
      const border = Math.min(w, h) * 0.05;
      ctx.strokeStyle = "#c4956a";
      ctx.lineWidth = border;
      ctx.strokeRect(border / 2, border / 2, w - border, h - border);
      ctx.strokeStyle = "#a0764e";
      ctx.lineWidth = 2;
      ctx.strokeRect(border + 4, border + 4, w - border * 2 - 8, h - border * 2 - 8);
      const bannerH = h * 0.1;
      ctx.fillStyle = "rgba(139, 90, 43, 0.85)";
      ctx.fillRect(border, h - border - bannerH, w - border * 2, bannerH);
      drawText(ctx, `Greetings from ${destination.charAt(0).toUpperCase() + destination.slice(1)}!`, w / 2, h - border - bannerH / 2 + 6, `bold ${bannerH * 0.45}px serif`, "#f5e6c8");
    },
  },
  {
    key: "polaroid",
    labelKey: "frame_polaroid",
    fallbackDraw: (ctx, w, h, landmarkName) => {
      const side = w * 0.04;
      const top = h * 0.04;
      const bottom = h * 0.15;
      ctx.fillStyle = "#f5f5f0";
      ctx.fillRect(0, 0, w, top);
      ctx.fillRect(0, 0, side, h);
      ctx.fillRect(w - side, 0, side, h);
      ctx.fillRect(0, h - bottom, w, bottom);
      drawText(ctx, landmarkName, w / 2, h - bottom / 2 + 8, `italic ${bottom * 0.3}px 'Georgia', serif`, "#555");
    },
  },
  {
    key: "film",
    labelKey: "frame_film",
    filter: "saturate(0.7) contrast(1.1)",
    fallbackDraw: (ctx, w, h) => {
      const stripW = w * 0.06;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, stripW, h);
      ctx.fillRect(w - stripW, 0, stripW, h);
      const holeW = stripW * 0.5;
      const holeH = stripW * 0.35;
      const spacing = holeH * 3;
      ctx.fillStyle = "#333";
      for (let y = spacing; y < h - spacing; y += spacing) {
        ctx.beginPath();
        ctx.roundRect((stripW - holeW) / 2, y, holeW, holeH, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(w - stripW + (stripW - holeW) / 2, y, holeW, holeH, 2);
        ctx.fill();
      }
    },
  },
  {
    key: "golden",
    labelKey: "frame_golden",
    fallbackDraw: (ctx, w, h) => {
      const border = Math.min(w, h) * 0.05;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#d4a843");
      grad.addColorStop(0.3, "#f5d782");
      grad.addColorStop(0.5, "#d4a843");
      grad.addColorStop(0.7, "#f5d782");
      grad.addColorStop(1, "#b8902e");
      ctx.strokeStyle = grad;
      ctx.lineWidth = border;
      ctx.strokeRect(border / 2, border / 2, w - border, h - border);
      ctx.strokeStyle = "#b8902e";
      ctx.lineWidth = 2;
      ctx.strokeRect(border + 3, border + 3, w - border * 2 - 6, h - border * 2 - 6);
    },
  },
  {
    key: "stamp",
    labelKey: "frame_stamp",
    fallbackDraw: (ctx, w, h, landmarkName) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.3;
      ctx.save();
      ctx.strokeStyle = "rgba(180, 40, 40, 0.7)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      drawText(ctx, landmarkName.toUpperCase(), cx, cy - r * 0.3, `bold ${r * 0.13}px sans-serif`, "rgba(180, 40, 40, 0.8)");
      const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      drawText(ctx, date, cx, cy + 4, `${r * 0.12}px sans-serif`, "rgba(180, 40, 40, 0.7)");
      drawText(ctx, "★", cx, cy + r * 0.3, `${r * 0.2}px sans-serif`, "rgba(180, 40, 40, 0.6)");
      ctx.restore();
    },
  },
  {
    key: "poster",
    labelKey: "frame_poster",
    fallbackDraw: (ctx, w, h, landmarkName) => {
      const border = Math.min(w, h) * 0.06;
      ctx.fillStyle = "#1e3a5f";
      ctx.fillRect(0, 0, w, border);
      ctx.fillRect(0, h - border * 2.5, w, border * 2.5);
      ctx.fillRect(0, 0, border, h);
      ctx.fillRect(w - border, 0, border, h);
      drawText(ctx, "VISIT", w / 2, h - border * 1.8, `bold ${border * 0.8}px sans-serif`, "#f5d782");
      drawText(ctx, landmarkName.toUpperCase(), w / 2, h - border * 0.7, `bold ${border * 0.6}px sans-serif`, "#ffffff");
    },
  },
];

export default function PhotoBooth({ videoRef, landmarkName, destination, langCode, onClose, dalleFrames }: PhotoBoothProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>("vintage");
  const [capturing, setCapturing] = useState(false);
  // Track loaded DALL-E Image objects for the current session
  const [dalleImages, setDalleImages] = useState<Record<string, HTMLImageElement>>({});

  const currentFrame = FRAMES.find((f) => f.key === selectedFrame) || FRAMES[0];
  const hasDalleFrame = !!dalleImages[selectedFrame];

  // Pre-load DALL-E frame images into HTMLImageElement objects
  useEffect(() => {
    if (!dalleFrames) return;
    const loaded: Record<string, HTMLImageElement> = {};
    let cancelled = false;

    const entries = Object.entries(dalleFrames);
    let remaining = entries.length;

    entries.forEach(([style, dataUrl]) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        loaded[style] = img;
        remaining--;
        if (remaining <= 0) {
          setDalleImages({ ...loaded });
        }
      };
      img.onerror = () => {
        remaining--;
        if (!cancelled && remaining <= 0) {
          setDalleImages({ ...loaded });
        }
      };
      img.src = dataUrl;
    });

    // If individual images load before all are done, update progressively
    const progressInterval = setInterval(() => {
      if (!cancelled && Object.keys(loaded).length > Object.keys(dalleImages).length) {
        setDalleImages({ ...loaded });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
    };
  }, [dalleFrames]); // eslint-disable-line react-hooks/exhaustive-deps

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const w = canvas.width;
    const h = canvas.height;

    // Apply filter if frame has one (only for fallback canvas frames)
    const dalleImg = dalleImages[currentFrame.key];

    if (!dalleImg) {
      ctx.filter = currentFrame.filter || "none";
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.filter = "none";

    if (dalleImg) {
      // Draw the DALL-E frame overlay on top of the camera feed
      // Use globalCompositeOperation to blend nicely
      ctx.globalAlpha = 0.85;
      ctx.drawImage(dalleImg, 0, 0, w, h);
      ctx.globalAlpha = 1.0;
    } else {
      // Fallback to simple canvas drawing
      currentFrame.fallbackDraw(ctx, w, h, landmarkName, destination);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [videoRef, currentFrame, landmarkName, destination, dalleImages]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || capturing) return;

    setCapturing(true);
    haptic("medium");

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `photo-${landmarkName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          incrementStat("photosTaken");
        }
        setCapturing(false);
      },
      "image/jpeg",
      0.9
    );
  }, [capturing, landmarkName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="rounded-full bg-stone-800/80 px-3 py-1 text-sm text-white backdrop-blur-sm"
        >
          {t("close", langCode)}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {t(currentFrame.labelKey, langCode)}
          </span>
          {hasDalleFrame && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
              AI
            </span>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Live preview */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-2">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>

      {/* Frame selector */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FRAMES.map((frame) => {
            const hasAI = !!dalleImages[frame.key];
            return (
              <button
                key={frame.key}
                onClick={() => {
                  haptic("light");
                  setSelectedFrame(frame.key);
                }}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedFrame === frame.key
                    ? "bg-amber-500 text-white"
                    : "bg-stone-800 text-stone-300"
                }`}
              >
                {t(frame.labelKey, langCode)}
                {hasAI && (
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    selectedFrame === frame.key ? "bg-white" : "bg-amber-400"
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Capture button */}
      <div className="flex-shrink-0 flex justify-center pb-8 pt-2">
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90 disabled:opacity-50"
        >
          <div className="mx-auto h-12 w-12 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
