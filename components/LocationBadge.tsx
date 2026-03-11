"use client";

import { useEffect, useState } from "react";

interface LocationBadgeProps {
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export default function LocationBadge({ onLocationUpdate }: LocationBadgeProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(true);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        onLocationUpdate?.(latitude, longitude);
      },
      () => setError(true),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationUpdate]);

  if (error) {
    return (
      <div className="rounded-full bg-red-900/80 px-3 py-1 text-xs text-red-300 backdrop-blur-sm">
        GPS unavailable
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="rounded-full bg-stone-800/80 px-3 py-1 text-xs text-stone-400 backdrop-blur-sm">
        Getting location...
      </div>
    );
  }

  return (
    <div className="rounded-full bg-stone-800/80 px-3 py-1 text-xs text-stone-300 backdrop-blur-sm">
      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
    </div>
  );
}
