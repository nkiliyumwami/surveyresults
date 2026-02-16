import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = {
  children: ReactNode;
  requireActive?: boolean;
};

type TrainerProfileRow = {
  user_id: string;
  is_active: boolean | null;
};

export default function ProtectedRoute({ children, requireActive = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        if (!mounted) return;
        setAllowed(false);
        setLoading(false);
        return;
      }

      // If we don't require active status, login is enough
      if (!requireActive) {
        if (!mounted) return;
        setAllowed(true);
        setLoading(false);
        return;
      }

      // Otherwise, check trainer_profiles.is_active
      const { data: prof, error } = await supabase
        .from("trainer_profiles")
        .select("user_id,is_active")
        .eq("user_id", user.id)
        .maybeSingle<TrainerProfileRow>();

      // If can't read, treat as not active (safe default)
      const isActive = !error && !!prof?.is_active;

      if (!mounted) return;
      setAllowed(isActive);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [requireActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={requireActive ? "/trainer/profile" : "/trainer/login"} replace />;
  }

  return <>{children}</>;
}