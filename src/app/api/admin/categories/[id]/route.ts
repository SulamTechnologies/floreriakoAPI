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

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  await requireRole(req, "admin");
  const { id } = (ctx as { params: { id: string } }).params;
  const body = await req.json();
  const parsed = updateSchema.parse(body);

  const { data, error } = await supabase
    .from("categories")
    .update(parsed)
    .eq("id", id)
    .select("id, slug, name")
    .single();

  if (error) {
    if (error.code === "23505") throw ApiError.conflict("Slug ya en uso");
    throw ApiError.internal("Error al actualizar categoría");
  }
  if (!data) throw ApiError.notFound("Categoría no encontrada");

  return NextResponse.json(data);
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  await requireRole(req, "admin");
  const { id } = (ctx as { params: { id: string } }).params;

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw ApiError.internal("Error al eliminar categoría");

  return NextResponse.json({ success: true });
});
