import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set(
  (process.env["ALLOWED_ORIGINS"] ?? "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

const CORS_STATIC = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
};

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

export function optionsHandler(req: NextRequest) {
  const origin = getAllowedOrigin(req);
  const headers: Record<string, string> = { ...CORS_STATIC };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new NextResponse(null, { status: 204, headers });
}

export function applyCors(response: NextResponse, req: NextRequest): NextResponse {
  const origin = getAllowedOrigin(req);
  Object.entries(CORS_STATIC).forEach(([k, v]) => response.headers.set(k, v));
  if (origin) response.headers.set("Access-Control-Allow-Origin", origin);
  return response;
}
