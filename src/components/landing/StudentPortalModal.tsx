import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, ArrowRight, ExternalLink, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STORAGE_KEY = "student_portal_email";
const STORAGE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const SURVEY_URL = "https://forms.gle/Mf4Jj7jZK9iRrUDY8";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "pending"; studentId: string; name: string }
  | { status: "active"; studentId: string; name: string };

function getSavedEmail(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const { email, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(STORAGE_KEY);
      return "";
    }
    return email || "";
  } catch {
    return "";
  }
}

function saveEmail(email: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ email, expiry: Date.now() + STORAGE_TTL })
  );
}

interface StudentPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentPortalModal({ open, onOpenChange }: StudentPortalModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });

  // Load saved email when modal opens
  useEffect(() => {
    if (open) {
      const saved = getSavedEmail();
      if (saved) setEmail(saved);
      setState({ status: "idle" });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setState({ status: "loading" });

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, display_name, is_profile_active")
        .eq("email", trimmed)
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        setState({ status: "not_found" });
        return;
      }

      saveEmail(trimmed);
      const name = student.display_name || student.full_name || trimmed;

      if (student.is_profile_active) {
        setState({ status: "active", studentId: student.id, name });
        // Auto-redirect after a brief moment
        setTimeout(() => {
          onOpenChange(false);
          navigate(`/profile/${student.id}`);
        }, 800);
      } else {
        setState({ status: "pending", studentId: student.id, name });
      }
    } catch (err) {
      console.error("Student portal lookup error:", err);
      setState({ status: "not_found" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Student Portal
          </DialogTitle>
          <DialogDescription>
            Enter your email to access your profile
          </DialogDescription>
        </DialogHeader>

        {/* Email form — always visible unless redirecting */}
        {state.status !== "active" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state.status !== "idle" && state.status !== "loading") {
                  setState({ status: "idle" });
                }
              }}
              required
              autoFocus
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <Button
              type="submit"
              disabled={state.status === "loading" || !email.trim()}
              className="w-full gap-2"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Looking you up...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Continue
                </>
              )}
            </Button>
          </form>
        )}

        {/* Scenario A: Not found */}
        {state.status === "not_found" && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm text-foreground mb-3">
              We couldn't find a record for that email.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
                Apply via our survey form
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        {/* Scenario B: Pending profile */}
        {state.status === "pending" && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
            <p className="text-sm text-foreground mb-1">
              Welcome, <strong>{state.name}</strong>!
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Let's set up your profile first.
            </p>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                navigate(`/profile/${state.studentId}`);
              }}
            >
              <UserCircle className="h-4 w-4" />
              Continue to Activation
            </Button>
          </div>
        )}

        {/* Scenario C: Active — auto-redirecting */}
        {state.status === "active" && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-foreground mb-1">
              Welcome back, <strong>{state.name}</strong>!
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Redirecting to your profile…
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
