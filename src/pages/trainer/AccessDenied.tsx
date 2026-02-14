// src/pages/trainer/AccessDenied.tsx
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function TrainerAccessDenied() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/trainer/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl border border-white/10 bg-card/50 p-8 shadow-xl backdrop-blur"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-semibold">Access denied</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You’re signed in, but your account does not have trainer access for this portal.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => navigate("/", { replace: true })} variant="secondary">
                  Back to dashboard
                </Button>
                <Button onClick={() => navigate("/trainer/login", { replace: true })}>
                  Go to trainer login
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  Sign out
                </Button>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                If you believe this is a mistake, contact the admin to assign a trainer role in Supabase.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
