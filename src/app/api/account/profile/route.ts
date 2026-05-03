import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getProfile, updateProfile } from "@/domain/profiles";
import { z } from "zod";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const profile = await getProfile(user.id);
  return NextResponse.json(profile);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const body = await req.json();
  const parsed = updateProfileSchema.parse(body);
  await updateProfile(user.id, parsed);
  const profile = await getProfile(user.id);
  return NextResponse.json(profile);
});
