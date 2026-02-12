import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = {
  children: JSX.Element;
};

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("getSession error:", error);
        setIsAuthed(false);
      } else {
        setIsAuthed(!!data.session);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
          Checking authentication…
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/trainer/login" replace />;
  }

  return children;
}
