import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Invite-only access ──────────────────────────────────────────────────────
// Set INVITE_CODE in your environment (Vercel dashboard or .env.local).
// Share the link as: https://yourapp.vercel.app/?invite=YOUR_CODE
// First visit sets a cookie; after that no token needed.

const INVITE_COOKIE = "vtg_invite";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function checkInvite(request: NextRequest): NextResponse | null {
  const inviteCode = process.env.INVITE_CODE;

  // If no INVITE_CODE is set, access is open (dev mode)
  if (!inviteCode) return null;

  // Already has valid cookie
  if (request.cookies.get(INVITE_COOKIE)?.value === inviteCode) return null;

  // Check for ?invite= in the URL
  const token = request.nextUrl.searchParams.get("invite");
  if (token === inviteCode) {
    // Valid token — set cookie and strip the param from URL
    const url = request.nextUrl.clone();
    url.searchParams.delete("invite");
    const response = NextResponse.redirect(url);
    response.cookies.set(INVITE_COOKIE, inviteCode, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  }

  // No valid invite — block
  return new NextResponse(
    `<!DOCTYPE html>
<html><head><title>Private</title>
<style>body{background:#1c1917;color:#d6d3d1;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
div{text-align:center}h1{color:#f59e0b;font-size:1.5rem}p{color:#78716c;margin-top:0.5rem}</style>
</head><body><div><h1>Invite Only</h1><p>You need an invite link to access this app.</p></div></body></html>`,
    { status: 403, headers: { "Content-Type": "text/html" } }
  );
}

// ── Rate limiting ───────────────────────────────────────────────────────────

interface RateWindow {
  timestamps: number[];
}

const store = new Map<string, RateWindow>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
const WINDOW_MS = 60 * 1000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - WINDOW_MS;
  store.forEach((window, key) => {
    window.timestamps = window.timestamps.filter((ts) => ts > cutoff);
    if (window.timestamps.length === 0) store.delete(key);
  });
}

const TIER_LIMITS: Record<string, number> = {
  "/api/story": 5,
  "/api/heyday": 10,
  "/api/commentary": 20,
  "/api/discover-stories": 10,
  "/api/tts-stream": 30,
  "/api/tts": 30,
  "/api/geocode": 20,
  "/api/photo-frames": 10,
};

function getLimit(pathname: string): number | null {
  for (const [route, limit] of Object.entries(TIER_LIMITS)) {
    if (pathname.startsWith(route)) return limit;
  }
  return null;
}

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const window = store.get(key) || { timestamps: [] };
  window.timestamps = window.timestamps.filter((t) => t > cutoff);

  if (window.timestamps.length >= limit) {
    store.set(key, window);
    return true;
  }

  window.timestamps.push(now);
  store.set(key, window);
  return false;
}

// ── Middleware entry point ───────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  // Invite check on all page routes (not API — API is protected indirectly
  // because you can't call it without the app loaded)
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    const blocked = checkInvite(request);
    if (blocked) return blocked;
    return NextResponse.next();
  }

  // Rate limiting on API routes
  cleanup();

  const limit = getLimit(request.nextUrl.pathname);
  if (limit === null) return NextResponse.next();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${request.nextUrl.pathname}`;

  if (isRateLimited(key, limit)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
