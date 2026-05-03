import { supabase } from "@/lib/supabase/server";
import { ApiError } from "@/lib/errors";

export interface ProfileDTO {
  id: string;
  full_name: string | null;
  role: "customer" | "admin";
  email: string | null;
}

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();

  if (error || !data) throw ApiError.notFound("Perfil");

  const profile = data as unknown as Record<string, unknown>;

  // Get email from auth admin API (service_role supports this)
  let email: string | null = null;
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    email = userData?.user?.email ?? null;
  } catch {
    // Non-fatal: proceed without email
  }

  return {
    id: profile["id"] as string,
    full_name: (profile["full_name"] as string | null) ?? null,
    role: profile["role"] as "customer" | "admin",
    email,
  };
}

export async function updateProfile(userId: string, data: { full_name?: string }): Promise<void> {
  const { error } = await supabase.from("profiles").update(data).eq("id", userId);

  if (error) throw ApiError.internal("Error al actualizar perfil");
}
