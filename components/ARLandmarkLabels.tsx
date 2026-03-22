"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NearbyLandmarkWithDistance, formatDistance } from "@/lib/landmarks";
import { t, tContent } from "@/lib/translations";
import { haptic } from "@/lib/haptics";

interface ARLandmarkLabelsProps {
  userLocation: { lat: number; lng: number } | null;
  landmarks: NearbyLandmarkWithDistance[];
  langCode: string;
  onSelectLandmark?: (key: string) => void;
}

type CompassState = "pending" | "granted" | "denied" | "unavailable";

export default function ARLandmarkLabels({
  userLocation,
  landmarks,
  langCode,
  onSelectLandmark,
}: ARLandmarkLabelsProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<CompassState>("pending");
  const headingRef = useRef<number | null>(null);

  // Handle device orientation for compass heading
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let h: number | null = null;
    // iOS provides webkitCompassHeading
    if ("webkitCompassHeading" in e && typeof (e as any).webkitCompassHeading === "number") {
      h = (e as any).webkitCompassHeading as number;
    } else if (e.alpha !== null && e.absolute) {
      // Android absolute orientation
      h = (360 - e.alpha) % 360;
    } else if (e.alpha !== null) {
      // Fallback non-absolute
      h = (360 - e.alpha) % 360;
    }
    if (h !== null) {
      headingRef.current = h;
      setHeading(h);
      if (compassState === "pending") setCompassState("granted");
    }
  }, [compassState]);

  // Request compass permission (iOS requires explicit request)
  const requestCompass = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== "undefined" &&
        "requestPermission" in DeviceOrientationEvent &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
          setCompassState("granted");
        } else {
          setCompassState("denied");
        }
      } catch {
        setCompassState("unavailable");
      }
    } else {
      // Android / desktop — try directly
      window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.addEventListener("deviceorientation", handleOrientation, true);
      // If no event fires within 2s, mark unavailable
      setTimeout(() => {
        if (headingRef.current === null) {
          setCompassState("unavailable");
        }
      }, 2000);
    }
  }, [handleOrientation]);

  useEffect(() => {
    requestCompass();
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    };
  }, [requestCompass, handleOrientation]);

  // Calculate screen position for a label based on bearing vs compass heading
  const getScreenX = (bearing: number): number => {
    if (heading === null) return 0;
    let diff = ((bearing - heading + 540) % 360) - 180; // -180 to 180
    return (diff / 90) * (window.innerWidth / 2) + window.innerWidth / 2;
  };

  const getOpacity = (bearing: number): number => {
    if (heading === null) return 1;
    const diff = Math.abs(((bearing - heading + 540) % 360) - 180);
    if (diff > 60) return 0;
    if (diff > 40) return 0.3;
    return 1;
  };

  // Compass unavailable or iOS needs permission — show as simple list
  if (compassState === "pending") {
    return (
      <div className="absolute top-16 left-0 right-0 z-10 flex justify-center pointer-events-auto">
        <button
          onClick={() => {
            haptic("light");
            requestCompass();
          }}
          className="rounded-full bg-stone-800/90 px-4 py-2 text-xs text-white backdrop-blur-sm"
        >
          {t("enable_compass", langCode)}
        </button>
      </div>
    );
  }

  if (compassState === "unavailable" || compassState === "denied") {
    // Fallback: show a horizontal strip of landmark labels
    return (
      <div className="absolute top-16 left-0 right-0 z-10 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto px-3 py-1 pointer-events-auto scrollbar-hide">
          {landmarks.slice(0, 8).map((lm) => (
            <button
              key={lm.key}
              onClick={() => {
                haptic("light");
                onSelectLandmark?.(lm.key);
              }}
              className="shrink-0 rounded-full bg-stone-800/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm flex items-center gap-1.5"
            >
              <span>{tContent(`lm:${lm.key}`, langCode, lm.landmark.name)}</span>
              <span className="text-stone-400">{formatDistance(lm.distanceMeters)}</span>
            </button>
          ))}
        </div>
        {landmarks.length === 0 && (
          <p className="text-center text-xs text-stone-500 py-2">
            {t("compass_unavailable", langCode)}
          </p>
        )}
      </div>
    );
  }

  // AR mode: floating labels positioned by compass
  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {landmarks.slice(0, 10).map((lm, i) => {
        const x = getScreenX(lm.bearing);
        const opacity = getOpacity(lm.bearing);
        if (opacity === 0) return null;
        // Stagger vertically: even/odd row
        const y = i % 2 === 0 ? 80 : 120;

        return (
          <button
            key={lm.key}
            onClick={() => {
              haptic("light");
              onSelectLandmark?.(lm.key);
            }}
            className="absolute pointer-events-auto transition-all duration-200 ease-out"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: "translateX(-50%)",
              opacity,
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm whitespace-nowrap">
                {tContent(`lm:${lm.key}`, langCode, lm.landmark.name)}
              </div>
              <span className="rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                {formatDistance(lm.distanceMeters)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
