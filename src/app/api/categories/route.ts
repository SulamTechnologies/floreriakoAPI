import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling, ApiError } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { supabase } from "@/lib/supabase/server";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const { data, error } = await supabase.from("categories").select("id, slug, name").order("name");

  if (error) throw ApiError.internal("Error al obtener categorías");

  return NextResponse.json(data);
});
