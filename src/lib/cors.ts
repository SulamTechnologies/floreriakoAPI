import { NextResponse } from "next/server";

const ORIGIN = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function optionsHandler() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function applyCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
