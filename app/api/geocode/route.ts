import { NextRequest, NextResponse } from "next/server";
import { apiLog } from "@/lib/api-logger";

export async function POST(req: NextRequest) {
  const log = apiLog("geocode");
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid query" },
        { status: 400 }
      );
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "VirtualTravelGuide/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service error" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.length) {
      return NextResponse.json(
        { error: "No results found" },
        { status: 404 }
      );
    }

    const result = data[0];

    log.done({ query });

    return NextResponse.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    });
  } catch (error: any) {
    log.error(error?.message || "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
