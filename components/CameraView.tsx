"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { t } from "@/lib/translations";

interface CameraViewProps {
  onCapture: (base64: string) => void;
  langCode: string;
  children?: React.ReactNode;
}

export default function CameraView({ onCapture, langCode, children }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(mediaStream);
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        if (mounted) setHasPermission(false);
      }
    }
    startCamera();
    return () => {
      mounted = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    onCapture(base64);
  }, [onCapture]);

  if (hasPermission === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-stone-900 p-8 text-center">
        <div className="text-5xl">📷</div>
        <h2 className="text-xl font-bold">{t("camera_required", langCode)}</h2>
        <p className="text-stone-400">
          {t("camera_description", langCode)}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Tap to capture overlay */}
      <button
        onClick={captureFrame}
        className="absolute inset-0 z-10"
        aria-label={t("capture_frame", langCode)}
      />

      {/* Floating UI overlays */}
      {children}
    </div>
  );
}
