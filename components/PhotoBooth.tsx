"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { incrementStat } from "@/lib/trip-tracker";
import { t } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

interface PhotoBoothProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarkName: string;
  landmarkKey: string | null;
  langCode: string;
  onClose: () => void;
}

type FrameStyle = "vintage" | "polaroid" | "film" | "golden" | "stamp" | "poster";

interface FrameDef {
  key: FrameStyle;
  labelKey: string;
  fallbackDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, landmark: string) => void;
}

const FRAMES: FrameDef[] = [
  {
    key: "vintage",
    labelKey: "frame_vintage",
    fallbackDraw(ctx, w, h, landmark) {
      // Sepia-tinted border
      ctx.save();
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = Math.max(12, w * 0.025);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
      // Inner stroke
      ctx.strokeStyle = "#C4A775";
      ctx.lineWidth = Math.max(4, w * 0.008);
      const inset = Math.max(18, w * 0.035);
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      // Banner at bottom
      const bannerH = Math.max(40, h * 0.08);
      ctx.fillStyle = "rgba(139,115,85,0.85)";
      ctx.fillRect(0, h - bannerH, w, bannerH);
      ctx.fillStyle = "#FFF8E7";
      ctx.font = `bold ${Math.max(14, bannerH * 0.45)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Greetings from ${landmark}`, w / 2, h - bannerH / 2);
      ctx.restore();
    },
  },
  {
    key: "polaroid",
    labelKey: "frame_polaroid",
    fallbackDraw(ctx, w, h, landmark) {
      const border = Math.max(12, w * 0.03);
      const bottomBorder = Math.max(50, h * 0.12);
      // White polaroid frame
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, border); // top
      ctx.fillRect(0, 0, border, h); // left
      ctx.fillRect(w - border, 0, border, h); // right
      ctx.fillRect(0, h - bottomBorder, w, bottomBorder); // bottom
      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 1;
      ctx.strokeRect(border, border, w - border * 2, h - border - bottomBorder);
      ctx.shadowBlur = 0;
      // Handwritten landmark name
      ctx.fillStyle = "#333";
      ctx.font = `italic ${Math.max(14, bottomBorder * 0.35)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(landmark, w / 2, h - bottomBorder / 2);
      ctx.restore();
    },
  },
  {
    key: "film",
    labelKey: "frame_film",
    fallbackDraw(ctx, w, h) {
      const stripW = Math.max(24, w * 0.055);
      const holeR = Math.max(4, stripW * 0.2);
      const holeSpacing = Math.max(16, h * 0.04);
      ctx.save();
      // Black strips
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, stripW, h);
      ctx.fillRect(w - stripW, 0, stripW, h);
      // Sprocket holes
      ctx.fillStyle = "#333";
      for (let y = holeSpacing; y < h; y += holeSpacing) {
        // Left strip
        ctx.beginPath();
        ctx.roundRect(stripW * 0.25, y - holeR, stripW * 0.5, holeR * 2, holeR * 0.4);
        ctx.fill();
        // Right strip
        ctx.beginPath();
        ctx.roundRect(w - stripW * 0.75, y - holeR, stripW * 0.5, holeR * 2, holeR * 0.4);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    key: "golden",
    labelKey: "frame_golden",
    fallbackDraw(ctx, w, h) {
      const borderW = Math.max(10, w * 0.025);
      ctx.save();
      // Gold gradient border
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#D4AF37");
      grad.addColorStop(0.3, "#F5E6A3");
      grad.addColorStop(0.5, "#D4AF37");
      grad.addColorStop(0.7, "#B8962E");
      grad.addColorStop(1, "#D4AF37");
      ctx.strokeStyle = grad;
      ctx.lineWidth = borderW;
      ctx.strokeRect(borderW / 2, borderW / 2, w - borderW, h - borderW);
      // Inner stroke
      ctx.strokeStyle = "rgba(212,175,55,0.5)";
      ctx.lineWidth = Math.max(2, borderW * 0.3);
      const inset = borderW + 4;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.restore();
    },
  },
  {
    key: "stamp",
    labelKey: "frame_stamp",
    fallbackDraw(ctx, w, h, landmark) {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;
      ctx.save();
      // Dashed circle
      ctx.strokeStyle = "rgba(200,30,30,0.7)";
      ctx.lineWidth = Math.max(3, r * 0.04);
      ctx.setLineDash([r * 0.06, r * 0.04]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Landmark name curved at top
      ctx.fillStyle = "rgba(200,30,30,0.75)";
      ctx.font = `bold ${Math.max(12, r * 0.14)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(landmark.toUpperCase(), cx, cy - r * 0.5);
      // Date at bottom
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      ctx.font = `${Math.max(10, r * 0.1)}px sans-serif`;
      ctx.fillText(dateStr, cx, cy + r * 0.5);
      // Star in center
      const starR = r * 0.12;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + starR * Math.cos(angle), cy + starR * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
  {
    key: "poster",
    labelKey: "frame_poster",
    fallbackDraw(ctx, w, h, landmark) {
      const borderW = Math.max(16, w * 0.04);
      ctx.save();
      // Navy border
      ctx.fillStyle = "#1B2A4A";
      ctx.fillRect(0, 0, w, borderW); // top
      ctx.fillRect(0, 0, borderW, h); // left
      ctx.fillRect(w - borderW, 0, borderW, h); // right
      ctx.fillRect(0, h - borderW * 2.5, w, borderW * 2.5); // bottom (wider)
      // "VISIT" text
      ctx.fillStyle = "#F5E6A3";
      ctx.font = `${Math.max(10, borderW * 0.6)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const bottomCenter = h - borderW * 1.25;
      ctx.fillText("VISIT", w / 2, bottomCenter - borderW * 0.5);
      // Landmark name in caps
      ctx.font = `bold ${Math.max(14, borderW * 0.9)}px sans-serif`;
      ctx.fillText(landmark.toUpperCase(), w / 2, bottomCenter + borderW * 0.3);
      ctx.restore();
    },
  },
];

/**
 * Resize a data URL image to a max dimension and return as raw base64.
 * Keeps the image large enough for Gemini to produce a good edit.
 */
function resizeForFrame(dataUrl: string, maxDim = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Render a static canvas-drawn frame over the captured photo.
 * Used as a fallback when the Gemini API is unavailable.
 */
function renderFallbackFrame(photoDataUrl: string, frameKey: FrameStyle, landmark: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(photoDataUrl); return; }
      ctx.drawImage(img, 0, 0);
      const frame = FRAMES.find((f) => f.key === frameKey);
      if (frame) frame.fallbackDraw(ctx, canvas.width, canvas.height, landmark);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(photoDataUrl);
    img.src = photoDataUrl;
  });
}

type Mode = "camera" | "edit";

export default function PhotoBooth({ videoRef, landmarkName, landmarkKey, langCode, onClose }: PhotoBoothProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("camera");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [frameCache, setFrameCache] = useState<Record<string, string>>({});

  // Attach the parent camera stream to our local video element.
  // Runs on mount and whenever mode changes (the video element stays mounted
  // but we re-check in case srcObject was lost).
  useEffect(() => {
    if (mode !== "camera") return;
    const parentVideo = videoRef.current;
    const localVideo = localVideoRef.current;
    if (!parentVideo || !localVideo) return;

    const stream = parentVideo.srcObject as MediaStream | null;
    if (stream && localVideo.srcObject !== stream) {
      localVideo.srcObject = stream;
    }
  }, [mode, videoRef]);

  const handleCapture = useCallback(() => {
    const video = localVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    haptic("medium");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedPhoto(dataUrl);
    setDisplayImage(dataUrl);
    setSelectedFrame(null);
    setMode("edit");
  }, []);

  const handleSelectFrame = useCallback(
    async (frameKey: FrameStyle) => {
      if (!capturedPhoto || loading) return;

      haptic("light");
      setSelectedFrame(frameKey);

      // Check cache first
      if (frameCache[frameKey]) {
        setDisplayImage(frameCache[frameKey]);
        return;
      }

      setLoading(true);
      try {
        // Resize before sending to keep the request body manageable
        const resized = await resizeForFrame(capturedPhoto);

        const response = await fetch("/api/photo-frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: resized,
            frameStyle: frameKey,
            landmarkKey,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Error ${response.status}`);
        }

        const data = await response.json();
        if (data.imageDataUrl) {
          setFrameCache((prev) => ({ ...prev, [frameKey]: data.imageDataUrl }));
          setDisplayImage(data.imageDataUrl);
        }
      } catch (err: any) {
        console.error("[PhotoBooth] Frame API failed, using static fallback:", err);
        const fallback = await renderFallbackFrame(capturedPhoto, frameKey, landmarkName);
        setFrameCache((prev) => ({ ...prev, [frameKey]: fallback }));
        setDisplayImage(fallback);
      } finally {
        setLoading(false);
      }
    },
    [capturedPhoto, loading, frameCache, landmarkKey, landmarkName]
  );

  const handleDownload = useCallback(() => {
    if (!displayImage) return;
    haptic("medium");

    const a = document.createElement("a");
    a.href = displayImage;
    a.download = `photo-${landmarkName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.jpg`;
    a.click();
    incrementStat("photosTaken");
  }, [displayImage, landmarkName]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setDisplayImage(null);
    setSelectedFrame(null);
    setFrameCache({});
    setMode("camera");
  }, []);

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
        {mode === "edit" && landmarkName && (
          <span className="text-sm font-semibold text-white truncate max-w-[200px]">
            {landmarkName}
          </span>
        )}
        <div className="w-12" />
      </div>

      {/*
        Video is always mounted so the stream stays attached.
        Hidden via CSS when in edit mode.
      */}
      <div className={`flex-1 flex items-center justify-center min-h-0 px-2 ${mode !== "camera" ? "hidden" : ""}`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>

      {mode === "camera" ? (
        <>
          {/* Hint text */}
          <div className="flex-shrink-0 text-center py-2">
            <span className="text-sm text-stone-400">
              {t("tap_to_capture", langCode)}
            </span>
          </div>

          {/* Capture button */}
          <div className="flex-shrink-0 flex justify-center pb-8 pt-2">
            <button
              onClick={handleCapture}
              className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-white" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Captured / framed photo display */}
          <div className="flex-1 flex items-center justify-center min-h-0 px-2 relative">
            {displayImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt="Captured photo"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center">
                  <div className="mb-2 h-8 w-8 animate-spin rounded-full border-3 border-amber-400 border-t-transparent mx-auto" />
                  <span className="text-sm text-white">{t("applying_frame", langCode)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Frame style selector */}
          <div className="flex-shrink-0 px-4 py-2">
            <p className="text-xs text-stone-500 mb-2 text-center">
              {t("choose_frame", langCode)}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FRAMES.map((frame) => (
                <button
                  key={frame.key}
                  onClick={() => handleSelectFrame(frame.key)}
                  disabled={loading}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    selectedFrame === frame.key
                      ? "bg-amber-500 text-white"
                      : "bg-stone-800 text-stone-300"
                  } disabled:opacity-50`}
                >
                  {t(frame.labelKey, langCode)}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex justify-center gap-3 pb-8 pt-2 px-4">
            <button
              onClick={handleRetake}
              className="rounded-full bg-stone-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("retake", langCode)}
            </button>
            <button
              onClick={handleDownload}
              disabled={!displayImage}
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t("download_photo", langCode)}
            </button>
          </div>
        </>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
