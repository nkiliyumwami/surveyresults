import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getPortalToken, portalGetMe, type PortalStudent } from "@/lib/portalApi";

function PageLoader() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}

interface PortalProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function PortalProtectedRoute({
  children,
  requireAdmin = false,
}: PortalProtectedRouteProps) {
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "forbidden">("loading");
  const location = useLocation();

  useEffect(() => {
    const token = getPortalToken();
    if (!token) {
      setStatus("unauth");
      return;
    }

    portalGetMe()
      .then(({ student }) => {
        if (requireAdmin && student.role !== "admin") {
          setStatus("forbidden");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        setStatus("unauth");
      });
  }, [requireAdmin, location.pathname]);

  if (status === "loading") return <PageLoader />;
  if (status === "unauth") return <Navigate to="/portal/login" replace />;
  if (status === "forbidden") return <Navigate to="/portal" replace />;

  return <>{children}</>;
}
