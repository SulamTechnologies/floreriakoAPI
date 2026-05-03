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

const PRODUCT_SELECT = `*, product_categories( categories( id, slug, name ) )`;

function mapAdminProduct(row: Record<string, unknown>) {
  const cats = Array.isArray(row["product_categories"]) ? row["product_categories"] : [];
  return {
    id: row["id"] as string,
    slug: row["slug"] as string,
    name: row["name"] as string,
    description: row["description"] as string | null,
    price_cents: row["price_cents"] as number,
    currency: row["currency"] as string,
    stock: row["stock"] as number,
    image_url: row["image_url"] as string | null,
    active: row["active"] as boolean,
    created_at: row["created_at"] as string,
    categories: (cats as Record<string, unknown>[])
      .filter((pc) => pc["categories"] !== null)
      .map((pc) => {
        const cat = pc["categories"] as Record<string, unknown>;
        return {
          id: cat["id"] as string,
          slug: cat["slug"] as string,
          name: cat["name"] as string,
        };
      }),
  };
}

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image_url: z.string().url().optional(),
  active: z.boolean().optional(),
  category_ids: z
    .array(
      z
        .string()
        .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
    )
    .optional(),
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  await requireRole(req, "admin");
  const { params } = ctx as { params: { id: string } };
  const productId = params.id;

  const body = await req.json();
  const parsed = updateProductSchema.parse(body);

  const { category_ids, ...productData } = parsed;

  // Only update product fields if there are any
  if (Object.keys(productData).length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", productId);

    if (updateError) {
      if (updateError.code === "23505") {
        throw ApiError.conflict("Ya existe un producto con ese slug");
      }
      throw ApiError.internal("Error al actualizar producto");
    }
  }

  // Replace category relations if provided
  if (category_ids !== undefined) {
    // Delete existing
    await supabase.from("product_categories").delete().eq("product_id", productId);

    // Insert new ones
    if (category_ids.length > 0) {
      const relations = category_ids.map((cat_id) => ({
        product_id: productId,
        category_id: cat_id,
      }));
      const { error: catError } = await supabase.from("product_categories").insert(relations);
      if (catError) throw ApiError.internal("Error al actualizar categorías");
    }
  }

  const { data: updated, error: fetchError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .single();

  if (fetchError || !updated) throw ApiError.notFound("Producto");

  return NextResponse.json(mapAdminProduct(updated as unknown as Record<string, unknown>));
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  await requireRole(req, "admin");
  const { params } = ctx as { params: { id: string } };
  const productId = params.id;

  const { error } = await supabase.from("products").update({ active: false }).eq("id", productId);

  if (error) throw ApiError.internal("Error al desactivar producto");

  return NextResponse.json({ success: true });
});
