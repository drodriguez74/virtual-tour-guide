"use client";

import { useEffect, useState } from "react";

interface LocationBadgeProps {
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export default function LocationBadge({ onLocationUpdate }: LocationBadgeProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState(false);

  // manual override state
  const [editing, setEditing] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  useEffect(() => {
    if (editing) return; // don't update while user is editing

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
  }, [onLocationUpdate, editing]);

  const applyManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoords({ lat, lng });
      onLocationUpdate?.(lat, lng);
      setEditing(false);
    }
  };

  const renderBadge = () => {
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
  };

  return (
    <>
      {editing ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 rounded bg-stone-900/95 p-4 backdrop-blur-md">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="lat"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-24 rounded bg-stone-800 px-2 py-1 text-xs text-white"
            />
            <input
              type="number"
              step="any"
              placeholder="lng"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-24 rounded bg-stone-800 px-2 py-1 text-xs text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyManual}
              className="rounded bg-amber-500 px-3 py-1 text-xs text-white"
            >
              Set
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded bg-stone-700 px-3 py-1 text-xs text-stone-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div
        onClick={() => setEditing(true)}
        className="relative cursor-pointer"
        title="Click to manually set coordinates"
      >
        {renderBadge()}
      </div>
    </>
  );
}
