import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// lazy load trainer pages so they can't crash the main dashboard
const TrainerLogin = lazy(() => import("./pages/trainer/Login"));
const TrainerHome = lazy(() => import("./pages/trainer/Home"));
const TrainerProfile = lazy(() => import("./pages/trainer/Profile"));
const TrainerAdmin = lazy(() => import("./pages/trainer/Admin"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    </div>
  );
}

function withSuspense(node: JSX.Element) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Index /> },

  { path: "/trainer/login", element: withSuspense(<TrainerLogin />) },

  {
    path: "/trainer",
    element: (
      <ProtectedRoute>{withSuspense(<TrainerHome />)}</ProtectedRoute>
    ),
  },

  {
    path: "/trainer/profile",
    element: (
      <ProtectedRoute>{withSuspense(<TrainerProfile />)}</ProtectedRoute>
    ),
  },

  {
    path: "/trainer/admin",
    element: (
      <AdminRoute>{withSuspense(<TrainerAdmin />)}</AdminRoute>
    ),
  },

  { path: "*", element: <NotFound /> },
]);
