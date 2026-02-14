// src/components/auth/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = {
  children: JSX.Element;
};

type AuthState = "loading" | "not_authed" | "authed_not_authorized" | "authorized";

export default function ProtectedRoute({ children }: Props) {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    let mounted = true;

    async function run() {
      // 1) Session check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError) {
        console.error("getSession error:", sessionError);
        setState("not_authed");
        return;
      }

      const session = sessionData.session;
      if (!session) {
        setState("not_authed");
        return;
      }

      // 2) Role check (trainer_roles)
      const userId = session.user.id;

      const { data: roleRow, error: roleError } = await supabase
        .from("trainer_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (roleError) {
        console.error("trainer_roles lookup error:", roleError);
        // safest behavior: deny access
        setState("authed_not_authorized");
        return;
      }

      if (!roleRow?.role) {
        setState("authed_not_authorized");
        return;
      }

      // If you want to restrict only certain roles, enforce here:
      // const allowed = ["trainer", "admin"];
      // if (!allowed.includes(roleRow.role)) { setState("authed_not_authorized"); return; }

      setState("authorized");
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Checking access…
        </div>
      </div>
    );
  }

  if (state === "not_authed") {
    return <Navigate to="/trainer/login" replace />;
  }

  if (state === "authed_not_authorized") {
    return <Navigate to="/trainer/access-denied" replace />;
  }

  return children;
}
