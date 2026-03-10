import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, CheckCircle, Clock, XCircle,
  UserPlus, Search, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "@/components/ui/use-toast";

interface BetaSignup {
  id: string;
  full_name: string;
  email: string;
  display_name: string;
  country: string;
  journey_level: string;
  target_role: string;
  weekly_hours: string;
  why_beta: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const STATUS_BADGE: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    class: "bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    class: "bg-cyber-green/10 text-cyber-green border-cyber-green/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    class: "bg-destructive/10 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function BetaSignups() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const fetchSignups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("beta_signups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading signups", description: error.message, variant: "destructive" });
    } else {
      setSignups(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSignups(); }, []);

  const activate = async (signup: BetaSignup) => {
    setActivating(signup.id);
    try {
      // Check if student already exists
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("email", signup.email)
        .maybeSingle();

      if (existing) {
        // Already exists — just make sure they're active
        await supabase
          .from("students")
          .update({ is_profile_active: true })
          .eq("email", signup.email);
      } else {
        // Insert new student record
        const { error: insertErr } = await supabase
          .from("students")
          .insert({
            full_name: signup.full_name,
            display_name: signup.display_name,
            email: signup.email,
            journey_level: signup.journey_level,
            target_role: signup.target_role,
            weekly_hours: signup.weekly_hours,
            is_profile_active: true,
          });
        if (insertErr) throw insertErr;
      }

      // Mark signup as approved
      const { error: updateErr } = await supabase
        .from("beta_signups")
        .update({ status: "approved" })
        .eq("id", signup.id);
      if (updateErr) throw updateErr;

      setSignups((prev) =>
        prev.map((s) => s.id === signup.id ? { ...s, status: "approved" } : s)
      );
      toast({ title: `✅ ${signup.display_name} activated`, description: "Student can now access CyberMentor." });
    } catch (err: any) {
      toast({ title: "Activation failed", description: err.message, variant: "destructive" });
    } finally {
      setActivating(null);
    }
  };

  const reject = async (id: string, name: string) => {
    const { error } = await supabase
      .from("beta_signups")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSignups((prev) => prev.map((s) => s.id === id ? { ...s, status: "rejected" } : s));
      toast({ title: `${name} marked as rejected` });
    }
  };

  const filtered = signups.filter((s) => {
    const matchesFilter = filter === "all" || s.status === filter;
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.country?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: signups.length,
    pending: signups.filter((s) => s.status === "pending").length,
    approved: signups.filter((s) => s.status === "approved").length,
    rejected: signups.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <Navbar />

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5">
            <Link to="/trainer"><ArrowLeft className="h-4 w-4" />Back to Portal</Link>
          </Button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Beta Signups
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review and activate students for CyberMentor access
              </p>
            </div>
            <Button onClick={fetchSignups} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  "card-cyber p-4 text-left transition-all",
                  filter === s ? "border-primary/50 bg-primary/5" : "hover:border-border",
                ].join(" ")}
              >
                <div className="text-2xl font-bold text-foreground font-mono">{counts[s]}</div>
                <div className="text-xs text-muted-foreground capitalize mt-0.5">{s}</div>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or country..."
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              // loading signups...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              // no signups found
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((signup) => {
                const badge = STATUS_BADGE[signup.status] || STATUS_BADGE.pending;
                const isExpanded = expanded === signup.id;

                return (
                  <motion.div
                    key={signup.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-cyber overflow-hidden"
                  >
                    {/* Row */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{signup.full_name}</span>
                          <span className="text-xs text-muted-foreground font-mono">@{signup.display_name}</span>
                          {signup.country && (
                            <span className="text-xs text-muted-foreground">· {signup.country}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{signup.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{signup.target_role}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-1 rounded-full border ${badge.class}`}>
                          {badge.icon}{badge.label}
                        </span>

                        {signup.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => activate(signup)}
                              disabled={activating === signup.id}
                              className="h-8 gap-1 text-xs"
                            >
                              {activating === signup.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserPlus className="h-3 w-3" />
                              )}
                              Activate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reject(signup.id, signup.display_name)}
                              className="h-8 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}

                        <button
                          onClick={() => setExpanded(isExpanded ? null : signup.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/50 px-4 py-4 bg-muted/20 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Journey Level</div>
                            <div className="text-foreground">{signup.journey_level || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Target Role</div>
                            <div className="text-foreground">{signup.target_role || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Weekly Hours</div>
                            <div className="text-foreground">{signup.weekly_hours || "—"}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Why Beta</div>
                          <div className="text-sm text-foreground">{signup.why_beta || "—"}</div>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Submitted: {new Date(signup.created_at).toLocaleString()}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
