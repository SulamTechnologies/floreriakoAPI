import type { NextRequest } from "next/server";
import { supabase } from "./server";
import { ApiError } from "@/lib/errors";

interface Profile {
  id: string;
  full_name: string | null;
  role: "customer" | "admin" | "sudo";
  created_at: string;
}

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Token de autorización requerido");
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw ApiError.unauthorized("Token inválido o expirado");
  }

  return data.user;
}

export async function requireRole(req: NextRequest, role: "admin" | "customer" | "sudo") {
  const user = await getUserFromRequest(req);

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error || !data) {
    throw ApiError.internal("Error al obtener perfil de usuario");
  }

  const profile = data as unknown as Profile;

  // sudo bypasses all role checks; admin bypasses customer checks
  if (profile.role === "sudo") return { user, profile };
  if (role !== "sudo" && profile.role === "admin") return { user, profile };
  if (profile.role !== role) throw ApiError.forbidden();

  return { user, profile };
}
