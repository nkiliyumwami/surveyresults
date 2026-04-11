import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const AdminNDA = lazy(() => import("./pages/AdminNDA"));

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public dashboard */}
            <Route path="/" element={<Index />} />

            {/* Public trainer login */}
            <Route path="/trainer/login" element={<TrainerLogin />} />

            {/* Protected trainer routes */}
            <Route
              path="/trainer"
              element={
                <ProtectedRoute>
                  <TrainerHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/profile"
              element={
                <ProtectedRoute>
                  <TrainerProfile />
                </ProtectedRoute>
              }
            />

            {/* Admin-only */}
            <Route
              path="/trainer/admin"
              element={
                <AdminRoute>
                  <TrainerAdmin />
                </AdminRoute>
              }
            />

            {/* NDA report (self-gated by password) */}
            <Route path="/admin/nda" element={<AdminNDA />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
