import { supabase } from "@/lib/supabase/server";
import { ApiError } from "@/lib/errors";
import type { ProductWithCategoriesDTO, PaginatedResponse } from "@/types/api";

interface GetProductsParams {
  category?: string;
  search?: string;
  page: number;
  per_page: number;
}

const SELECT_ALL = `*, product_categories( categories( id, slug, name ) )`;
// !inner makes Supabase do an INNER JOIN — filters products AND avoids null categories
const SELECT_BY_CATEGORY = `*, product_categories!inner( categories!inner( id, slug, name ) )`;

function mapProduct(row: Record<string, unknown>): ProductWithCategoriesDTO {
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

export async function getProducts(
  params: GetProductsParams,
): Promise<PaginatedResponse<ProductWithCategoriesDTO>> {
  const { page, per_page, category, search } = params;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from("products")
    .select(category ? SELECT_BY_CATEGORY : SELECT_ALL, { count: "exact" })
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (category) {
    query = query.eq("product_categories.categories.slug", category);
  }

  const { data, error, count } = await query;

  if (error) {
    throw ApiError.internal("Error al obtener productos");
  }

  const products = (data as unknown as Record<string, unknown>[]).map(mapProduct);

  return {
    data: products,
    total: count ?? 0,
    page,
    per_page,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategoriesDTO> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_ALL)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    throw ApiError.notFound("Producto");
  }

  return mapProduct(data as unknown as Record<string, unknown>);
}
