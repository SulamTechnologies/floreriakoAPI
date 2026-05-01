import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyCors, optionsHandler } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export function GET(req: NextRequest) {
  return applyCors(
    NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "floreriako-api",
    }),
    req,
  );
}
