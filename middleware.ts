import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
