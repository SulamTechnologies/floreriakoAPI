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

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  price_cents: z.number().int().min(0),
  stock: z.number().int().min(0),
  image_url: z.string().url().optional(),
  active: z.boolean().optional().default(true),
  category_ids: z
    .array(
      z
        .string()
        .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
    )
    .optional(),
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Error al obtener productos");

  const products = (data as unknown as Record<string, unknown>[]).map(mapAdminProduct);
  return NextResponse.json(products);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const body = await req.json();
  const parsed = createProductSchema.parse(body);

  const { category_ids, ...productData } = parsed;

  const { data: created, error: insertError } = await supabase
    .from("products")
    .insert(productData)
    .select("id")
    .single();

  if (insertError || !created) {
    if (insertError?.code === "23505") {
      throw ApiError.conflict("Ya existe un producto con ese slug");
    }
    throw ApiError.internal("Error al crear producto");
  }

  const newId = (created as unknown as Record<string, unknown>)["id"] as string;

  // Insert category relations if provided
  if (category_ids && category_ids.length > 0) {
    const relations = category_ids.map((cat_id) => ({
      product_id: newId,
      category_id: cat_id,
    }));
    const { error: catError } = await supabase.from("product_categories").insert(relations);
    if (catError) throw ApiError.internal("Error al asignar categorías");
  }

  // Return the full product with categories
  const { data: fullProduct, error: fetchError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", newId)
    .single();

  if (fetchError || !fullProduct) throw ApiError.internal("Error al obtener producto creado");

  return NextResponse.json(mapAdminProduct(fullProduct as unknown as Record<string, unknown>), {
    status: 201,
  });
});
