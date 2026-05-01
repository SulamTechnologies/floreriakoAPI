import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getProductBySlug } from "@/domain/products";

export const OPTIONS = optionsHandler;

type Ctx = { params: { slug: string } };

export const GET = withErrorHandling(async (_req: NextRequest, ctx: unknown) => {
  const { params } = ctx as Ctx;
  const product = await getProductBySlug(params.slug);
  return NextResponse.json(product);
});
