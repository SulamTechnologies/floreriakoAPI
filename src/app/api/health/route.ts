import { NextResponse } from "next/server";
import { applyCors, optionsHandler } from "@/lib/cors";

export const OPTIONS = optionsHandler;

export function GET() {
  return applyCors(
    NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "floreriako-api",
    }),
  );
}
