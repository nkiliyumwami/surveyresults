import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TrainerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        // SIGNUP flow
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) throw signupError;

        // Check if email confirmation is required.
        // When email confirmation is enabled, Supabase returns a user
        // with an empty identities array and/or a null session.
        const needsEmailConfirmation =
          data.user &&
          (!data.session || data.user.identities?.length === 0);

        if (needsEmailConfirmation) {
          // Show "check your inbox" UI instead of trying to auto-login
          setEmailConfirmationSent(true);
          return;
        }

        if (data.user) {
          // Create trainer_profiles row with is_active = true
          const { error: profileError } = await supabase
            .from("trainer_profiles")
            .insert({
              user_id: data.user.id,
              is_active: true,
            });

          if (profileError) throw profileError;

          // Auto-login after signup (only when email confirmation is disabled)
          const { error: loginError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (loginError) throw loginError;

          navigate("/trainer");
        }
      } else {
        // LOGIN flow
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
        navigate("/trainer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Email Confirmation Sent screen ---
  if (emailConfirmationSent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative flex min-h-screen items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <Mail className="h-12 w-12 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Check Your Inbox
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>.
                Please check your email and click the link to activate your
                account.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailConfirmationSent(false);
                setIsSignup(false);
              }}
            >
              Back to Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg"
        >
          <div className="flex flex-col items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isSignup ? "Create Trainer Account" : "Trainer Portal"}
            </h2>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Loading..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
            </Button>
          </form>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsSignup(!isSignup)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isSignup ? "Sign In Instead" : "Create Account"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
