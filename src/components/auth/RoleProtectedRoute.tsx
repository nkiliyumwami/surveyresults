import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = {
  children: JSX.Element;
  allowedRoles: string[]; // e.g. ["trainer", "admin"]
};

export default function RoleProtectedRoute({ children, allowedRoles }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      setLoading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError || !sessionData.session?.user) {
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;

      // Look up role in trainer_roles
      const { data: roleRow, error: roleError } = await supabase
        .from("trainer_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (roleError) {
        console.error("Role lookup error:", roleError);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      const role = roleRow?.role ?? "";
      setIsAllowed(allowedRoles.includes(role));
      setLoading(false);
    }

    checkAccess();

    // Re-check on login/logout
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!mounted) return;
      checkAccess();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Checking authorization…
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    // If not authorized, send them back to login (simple + safe)
    return <Navigate to="/trainer/login" replace />;
  }

  return children;
}
