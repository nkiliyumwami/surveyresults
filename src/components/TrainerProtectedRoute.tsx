import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { hasTrainerAccess } from "@/lib/trainerRoles";

type Props = {
  children: JSX.Element;
};

export default function TrainerProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      // 1) Session check
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error("getSession error:", error);
        setIsAuthed(false);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const authed = !!data.session;
      setIsAuthed(authed);

      // 2) Role check (only if authed)
      if (authed) {
        const access = await hasTrainerAccess(["admin", "trainer"]);
        if (!mounted) return;
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Checking trainer access…
        </div>
      </div>
    );
  }

  // Not logged in -> go login
  if (!isAuthed) {
    return <Navigate to="/trainer/login" replace />;
  }

  // Logged in but not authorized -> block
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="text-lg font-semibold text-foreground">Access denied</div>
          <div className="max-w-md text-sm text-muted-foreground">
            Your account is signed in, but it is not authorized for the Trainer Portal.
            Contact an admin to grant you access.
          </div>
          <button
            className="mt-2 text-sm text-primary underline underline-offset-4"
            onClick={() => supabase.auth.signOut().then(() => location.assign("/trainer/login"))}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return children;
}
