import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Sparkles, CheckCircle, Loader2, Bot } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface FormData {
  full_name: string;
  email: string;
  display_name: string;
  country: string;
  journey_level: string;
  target_role: string;
  weekly_hours: string;
  why_beta: string;
}

const JOURNEY_OPTIONS = [
  "Absolute Beginner: I am just starting and have no IT/Security background.",
  "Knowledgeable: I have some certifications or am currently studying (e.g., Security+, ISC2 CC).",
  "IT Professional: I work in IT (Helpdesk, SysAdmin) and want to pivot to Security.",
  "Security Professional: I already work in Security but want to level up my advanced skills.",
];

const ROLE_OPTIONS = [
  "Offensive: Ethical Hacking / Penetration Testing",
  "Defensive: Incident Response / SOC Analyst / Threat Hunting",
  "Governance: GRC (Governance, Risk, and Compliance) / Auditing",
  "Architecture: Cloud Security / Security Engineering",
  "Forensics: Digital Forensics / Malware Analysis",
];

const HOURS_OPTIONS = [
  "Casual: Less than 2 hours",
  "Focused: 2-5 hours",
  "Dedicated: 5-10 hours",
  "Accelerated: 10+ hours",
];

export default function BetaSignup() {
  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    display_name: "",
    country: "",
    journey_level: "",
    target_role: "",
    weekly_hours: "",
    why_beta: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setError("");
  };

  const isValid =
    form.full_name.trim().length >= 2 &&
    form.email.includes("@") &&
    form.display_name.trim().length >= 2 &&
    form.journey_level &&
    form.target_role &&
    form.weekly_hours &&
    form.why_beta.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError("");

    try {
      // Check if email already submitted
      const { data: existing } = await supabase
        .from("beta_signups")
        .select("id")
        .eq("email", form.email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        setError("This email has already been submitted for beta access.");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("beta_signups")
        .insert({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          display_name: form.display_name.trim(),
          country: form.country.trim(),
          journey_level: form.journey_level,
          target_role: form.target_role,
          weekly_hours: form.weekly_hours,
          why_beta: form.why_beta.trim(),
          status: "pending",
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-mono";
  const selectClass = "w-full h-11 px-4 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";
  const labelClass = "block text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <Navbar />

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">

          <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back to Home</Link>
          </Button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">CyberMentor Beta</h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10 uppercase tracking-wider">
                    Private
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Request early access to your AI cybersecurity coach
                </p>
              </div>
            </div>

            <div className="card-cyber p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  CyberMentor is a personalized AI voice coach that knows your cybersecurity learning profile. 
                  We're opening access to <strong className="text-foreground">50 students</strong> in this first beta. 
                  Fill out this form and we'll activate you when your spot is ready.
                </p>
              </div>
            </div>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-cyber p-10 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-cyber-green/10 border border-cyber-green/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-cyber-green" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">You're on the list!</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Your beta request has been received. We'll activate your CyberMentor access and notify you via email. Keep an eye on your inbox.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/">Back to Home</Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-cyber p-6 sm:p-8 space-y-6"
            >
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" value={form.full_name} onChange={set("full_name")} placeholder="Your full name" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Display Name *</label>
                    <input type="text" value={form.display_name} onChange={set("display_name")} placeholder="Name CyberMentor will use" className={inputClass} />
                    <p className="text-[11px] text-muted-foreground mt-1">This is how CyberMentor will greet you</p>
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input type="text" value={form.country} onChange={set("country")} placeholder="e.g. Rwanda, USA, Nigeria" className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Learning Profile */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Learning Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Where are you in your journey? *</label>
                    <select value={form.journey_level} onChange={set("journey_level")} className={selectClass}>
                      <option value="">Select your level...</option>
                      {JOURNEY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Target Role *</label>
                    <select value={form.target_role} onChange={set("target_role")} className={selectClass}>
                      <option value="">Select your goal...</option>
                      {ROLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Weekly Hours Available *</label>
                    <select value={form.weekly_hours} onChange={set("weekly_hours")} className={selectClass}>
                      <option value="">Select your commitment...</option>
                      {HOURS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Why Beta */}
              <div>
                <label className={labelClass}>Why do you want beta access? *</label>
                <textarea
                  value={form.why_beta}
                  onChange={set("why_beta")}
                  placeholder="Tell us what you're hoping to achieve with CyberMentor..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="w-full h-11 gap-2 font-mono uppercase tracking-wider text-xs"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Request Beta Access</>
                )}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                We'll notify you at your email when your spot is activated. No spam, ever.
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
