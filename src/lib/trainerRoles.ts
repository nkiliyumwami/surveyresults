import { supabase } from "@/lib/supabase";

/**
 * Returns true if the currently authenticated user has a trainer role.
 * Defaults allowed roles to ["admin", "trainer"].
 */
export async function hasTrainerAccess(
  allowedRoles: string[] = ["admin", "trainer"]
): Promise<boolean> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("getUser error:", userErr);
    return false;
  }
  if (!user) return false;

  const { data, error } = await supabase
    .from("trainer_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // IMPORTANT: If RLS blocks this, you’ll see it here.
    console.error("trainer_roles select error:", error);
    return false;
  }

  const role = (data?.role ?? "").toLowerCase();
  return allowedRoles.map((r) => r.toLowerCase()).includes(role);
}
