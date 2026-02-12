import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Award, UserRound, LogOut, Mail, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TrainerHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("—");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("getUser error:", error);
        setEmail("—");
        return;
      }
      setEmail(data.user?.email ?? "—");
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/trainer/login", { replace: true });
    } catch (e) {
      console.error("Logout error:", e);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Header Card */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-cyber p-4 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-foreground">
                  Trainer Portal
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your trainer profile, expertise, and availability.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono">{email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/trainer/profile")}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Edit Profile
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Next Steps Cards */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-cyber p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Trainer Profile</h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Add your name, timezone, contact, and a short bio so students can be
              matched appropriately.
            </p>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => navigate("/trainer/profile")}>
                Complete / Edit Profile
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card-cyber p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-cyber-purple" />
              <h2 className="text-sm font-semibold text-foreground">
                Expertise & Certifications
              </h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Choose your areas (SOC/IR, Pentest, GRC, Cloud, etc.) and list
              certifications to help build cohorts.
            </p>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => navigate("/trainer/profile")}>
                Update Expertise
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card-cyber p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyber-green" />
              <h2 className="text-sm font-semibold text-foreground">Availability</h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Provide your weekly availability windows (days + times). We’ll use
              this to schedule sessions and match students.
            </p>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => navigate("/trainer/profile")}>
                Set Availability
              </Button>
            </div>
          </motion.section>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 sm:mt-10 pb-6 sm:pb-8 text-center"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Trainer Portal • Next: invite trainers + optional role-based admin view
          </p>
        </motion.footer>
      </main>
    </div>
  );
}



