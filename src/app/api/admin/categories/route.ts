import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling, ApiError } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { requireRole } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/server";
import { z } from "zod";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const { data, error } = await supabase.from("categories").select("id, slug, name").order("name");

  if (error) throw ApiError.internal("Error al obtener categorías");

  return NextResponse.json(data);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const body = await req.json();
  const parsed = categorySchema.parse(body);

  const { data, error } = await supabase
    .from("categories")
    .insert(parsed)
    .select("id, slug, name")
    .single();

  if (error) {
    if (error.code === "23505") throw ApiError.conflict("Ya existe una categoría con ese slug");
    throw ApiError.internal("Error al crear categoría");
  }

  return NextResponse.json(data, { status: 201 });
});
