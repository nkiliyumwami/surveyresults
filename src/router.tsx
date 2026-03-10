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

// Student pages
const StudentProfile = lazy(() => import("./pages/student/Profile"));
const BetaSignup = lazy(() => import("./pages/BetaSignup"));

// Admin pages
const AdminAssignments = lazy(() => import("./pages/admin/Assignments"));

// Portal pages
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalAdmin = lazy(() => import("./pages/portal/PortalAdmin"));

// Dev/test pages (hidden routes)
const TestAssignments = lazy(() => import("./pages/dev/TestAssignments"));
const TestMatchingEngine = lazy(() => import("./pages/dev/TestMatchingEngine"));
const SyncStudents = lazy(() => import("./pages/dev/SyncStudents"));

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

  // Student profile
  { path: "/profile/:id", element: withSuspense(<StudentProfile />) },

  // Beta signup
  { path: "/beta", element: withSuspense(<BetaSignup />) },

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

  // Admin assignment dashboard
  {
    path: "/admin/assignments",
    element: (
      <AdminRoute>{withSuspense(<AdminAssignments />)}</AdminRoute>
    ),
  },

  // Hidden dev routes for testing
  {
    path: "/dev/test-assignments",
    element: (
      <AdminRoute>{withSuspense(<TestAssignments />)}</AdminRoute>
    ),
  },
  {
    path: "/dev/test-matching",
    element: (
      <AdminRoute>{withSuspense(<TestMatchingEngine />)}</AdminRoute>
    ),
  },
  {
    path: "/dev/sync-students",
    element: (
      <AdminRoute>{withSuspense(<SyncStudents />)}</AdminRoute>
    ),
  },

  // Portal routes
  { path: "/portal/login", element: withSuspense(<PortalLogin />) },
  { path: "/portal", element: withSuspense(<PortalDashboard />) },
  { path: "/portal/admin", element: withSuspense(<PortalAdmin />) },

  { path: "*", element: <NotFound /> },
]);
