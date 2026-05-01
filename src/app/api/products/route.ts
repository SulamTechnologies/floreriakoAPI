import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { productQuerySchema } from "@/lib/validation/schemas";
import { getProducts } from "@/domain/products";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const parsed = productQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    per_page: searchParams.get("per_page") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Parámetros inválidos",
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const result = await getProducts(parsed.data);
  return NextResponse.json(result);
});
