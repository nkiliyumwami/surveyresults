import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Award, UserRound, LogOut, Mail, Settings2, AlertTriangle, Download, Users, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

type AssignedStudent = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  country: string | null;
  journey_level: string | null;
  target_role: string | null;
  weekly_hours: string | null;
  certifications: string | null;
  roadmap: any | null;
};

export default function TrainerHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("—");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userError || !userData.user) {
        console.error("getUser error:", userError);
        setEmail("—");
        setLoadingStatus(false);
        return;
      }

      setEmail(userData.user.email ?? "—");

      // Check trainer active status and get trainer profile id
      const { data: profile, error: profileError } = await supabase
        .from("trainer_profiles")
        .select("id, is_active")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!mounted) return;
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setIsActive(false);
      } else {
        const active = profile?.is_active === true;
        setIsActive(active);
        if (active && profile?.id) {
          setTrainerId(profile.id);
        }
      }
      setLoadingStatus(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch assigned students once we know the trainer id
  useEffect(() => {
    if (!trainerId) return;
    let mounted = true;

    (async () => {
      setLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("student:students(id, full_name, display_name, email, country, journey_level, target_role, weekly_hours, certifications, roadmap)")
          .eq("trainer_id", trainerId)
          .eq("status", "active");

        if (error) throw error;
        if (!mounted) return;

        const students: AssignedStudent[] = (data || [])
          .map((row: any) => row.student)
          .filter(Boolean)
          .map((s: any) => ({
            id: s.id,
            full_name: s.full_name || null,
            display_name: s.display_name || null,
            email: s.email || null,
            country: s.country || null,
            journey_level: s.journey_level || null,
            target_role: s.target_role || null,
            weekly_hours: s.weekly_hours || null,
            certifications: s.certifications || null,
            roadmap: s.roadmap || null,
          }));

        setAssignedStudents(students);
      } catch (err) {
        console.error("Failed to load assigned students:", err);
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    })();

    return () => { mounted = false; };
  }, [trainerId]);

  function downloadRosterCSV() {
    const header = ["Name", "Email", "Country", "Journey Level", "Target Role", "Weekly Hours"];
    const rows = assignedStudents.map((s) => [
      s.full_name,
      s.email,
      s.country,
      s.journey_level,
      s.target_role,
      s.weekly_hours,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
      <Navbar />
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-7xl px-3 pt-20 pb-4 sm:px-6 sm:pt-24 sm:pb-8 lg:px-8">
        {loadingStatus ? (
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : !isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card-cyber p-6 sm:p-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-7 w-7 text-yellow-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Account Pending Activation
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your account is pending administrator activation. Please contact the admin to begin receiving student assignments.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
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
          </motion.div>
        ) : (
        <>
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

        {/* Assigned Students */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 sm:mt-6 card-cyber p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                My Students ({assignedStudents.length})
              </h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={assignedStudents.length === 0}
              onClick={downloadRosterCSV}
            >
              <Download className="h-4 w-4" />
              Download Roster (CSV)
            </Button>
          </div>

          {loadingStudents ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading students...
            </div>
          ) : assignedStudents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No students assigned yet. Check back after the admin runs assignments.
            </div>
          ) : (
            <div className="space-y-3">
              {assignedStudents.map((s) => {
                const isExpanded = expandedStudents.has(s.id);
                const studentName = s.display_name || s.full_name || "Unknown";
                const rm = s.roadmap;
                const totalPhases = rm?.phases?.length || 0;
                const completedPhases = rm?.phases?.filter((p: any) => p.completed).length || 0;
                const certReadiness = rm?.cert_readiness || 0;
                const firstUncompletedIndex = rm?.phases?.findIndex((p: any) => !p.completed) ?? -1;

                return (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden"
                  >
                    {/* Summary row */}
                    <button
                      type="button"
                      onClick={() => toggleStudentExpand(s.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                    >
                      {/* Left: name + role + country */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {studentName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {s.target_role && (
                            <span className="text-xs text-muted-foreground truncate">
                              {s.target_role}
                            </span>
                          )}
                          {s.country && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 border border-border/30 text-muted-foreground">
                              {s.country}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: roadmap progress */}
                      <div className="flex-shrink-0 text-right">
                        {rm ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${certReadiness}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-primary">
                                {certReadiness}%
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Phase {completedPhases} of {totalPhases}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">
                            No roadmap yet
                          </p>
                        )}
                      </div>

                      {/* Right: weekly hours + chevron */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {s.weekly_hours && (
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {s.weekly_hours}h/wk
                          </span>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                        {/* Student info grid */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {s.email && <span className="font-mono">{s.email}</span>}
                          {s.journey_level && <span>Level: {s.journey_level}</span>}
                          {s.certifications && <span>Certs: {s.certifications}</span>}
                        </div>

                        {!rm ? (
                          <p className="text-xs text-muted-foreground italic">
                            This student has not generated their learning roadmap yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {rm.summary && (
                              <p className="text-xs text-muted-foreground italic">
                                {rm.summary}
                              </p>
                            )}

                            {/* Cert readiness bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Cert Readiness</span>
                                <span className="font-mono font-bold text-primary">{certReadiness}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted/40 border border-border/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${certReadiness}%` }}
                                />
                              </div>
                            </div>

                            {/* Phase list */}
                            {rm.phases?.map((phase: any, i: number) => {
                              const isCurrent = !phase.completed && i === firstUncompletedIndex;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                                    phase.completed
                                      ? "bg-green-500/5 border border-green-500/20"
                                      : isCurrent
                                      ? "bg-primary/5 border border-primary/30"
                                      : "bg-muted/10 border border-border/30"
                                  }`}
                                >
                                  {phase.completed ? (
                                    <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                  ) : isCurrent ? (
                                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <span className="h-3.5 w-3.5 rounded-full border-2 border-border/40 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-foreground">
                                      Phase {phase.phase}: {phase.title}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      ({phase.duration_weeks} weeks)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {rm.generated_at && (
                              <p className="text-[10px] text-muted-foreground">
                                Generated: {rm.generated_at}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Quick Links */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-4 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card-cyber p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Trainer Profile</h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Update your name, timezone, contact, and bio.
            </p>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => navigate("/trainer/profile")}>
                Edit Profile
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card-cyber p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-cyber-purple" />
              <h2 className="text-sm font-semibold text-foreground">Expertise</h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Update your areas of expertise and certifications.
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
              Set your weekly availability windows for scheduling.
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
        </>
        )}
      </main>
    </div>
  );
}



