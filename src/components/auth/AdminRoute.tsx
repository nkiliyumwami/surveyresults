import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = {
  children: JSX.Element;
};

export default function AdminRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessionErr) {
          console.error("getSession error:", sessionErr);
          setAuthed(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const hasSession = !!sessionData.session;
        setAuthed(hasSession);

        if (!hasSession) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Role check via RPC (preferred)
        const { data: rpcData, error: rpcErr } = await supabase.rpc("is_admin");
        if (rpcErr) {
          console.error("is_admin RPC error:", rpcErr);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!rpcData);
        }

        setLoading(false);
      } catch (e) {
        console.error("AdminRoute unexpected error:", e);
        if (!mounted) return;
        setAuthed(false);
        setIsAdmin(false);
        setLoading(false);
      }
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
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!authed) return <Navigate to="/trainer/login" replace />;
  if (!isAdmin) return <Navigate to="/trainer/profile" replace />;

  return children;
}
