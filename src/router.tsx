import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";

import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// lazy load pages so they can't crash the landing page
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const TrainerLogin = lazy(() => import("./pages/trainer/Login"));
const TrainerHome = lazy(() => import("./pages/trainer/Home"));
const TrainerProfile = lazy(() => import("./pages/trainer/Profile"));
const TrainerAdmin = lazy(() => import("./pages/trainer/Admin"));

// Dev/test pages (hidden routes)
const TestAssignments = lazy(() => import("./pages/dev/TestAssignments"));

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

function withSuspense(node: JSX.Element) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  // Landing page (new root)
  { path: "/", element: <LandingPage /> },

  // Student dashboard (moved from root)
  { path: "/dashboard/students", element: withSuspense(<StudentDashboard />) },

  // Trainer routes
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

  // Hidden dev route for testing assignments infrastructure
  {
    path: "/dev/test-assignments",
    element: (
      <AdminRoute>{withSuspense(<TestAssignments />)}</AdminRoute>
    ),
  },

  { path: "*", element: <NotFound /> },
]);
