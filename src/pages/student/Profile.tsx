import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Globe,
  BookOpen,
  Award,
  ArrowLeft,
  Pencil,
  Check,
  X,
  RefreshCw,
  UserCircle,
  Mail,
  Lock,
  Sparkles,
  Loader2,
} from "lucide-react";

const STRIPE_PAYMENT_URL = "https://buy.stripe.com/YOUR_STRIPE_LINK_HERE";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface StudentData {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  country: string | null;
  journey_level: string | null;
  target_role: string | null;
  weekly_hours: string | null;
  certifications: string | null;
  profile_image_url: string | null;
  is_profile_active: boolean;
  student_certifications: { name: string; credly_url: string }[] | null;
}

interface MentorData {
  trainer_name: string | null;
  trainer_email: string | null;
  trainer_expertise: string[] | null;
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Inline name edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  // OTP auth gate state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Seat application modal state
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [studyGoal, setStudyGoal] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [seatSubmitting, setSeatSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;

    const [studentRes, mentorRes] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id, full_name, display_name, email, country, journey_level, target_role, weekly_hours, certifications, profile_image_url, is_profile_active, student_certifications"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.rpc("get_student_mentor", { p_student_id: id }),
    ]);

    if (studentRes.error || !studentRes.data) {
      setNotFound(true);
    } else {
      setStudent(studentRes.data);
      setEditName(studentRes.data.display_name || studentRes.data.full_name || "");
    }

    if (mentorRes.data && Array.isArray(mentorRes.data) && mentorRes.data.length > 0) {
      setMentor(mentorRes.data[0]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const name = student?.display_name || student?.full_name || "Student";

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 100) {
      setNameError("Name must be under 100 characters");
      return;
    }

    setSaving(true);
    setNameError("");

    try {
      const { error } = await supabase.rpc("update_student_display_name", {
        p_student_id: student!.id,
        p_display_name: trimmed,
      });

      if (error) throw error;

      setStudent((prev) =>
        prev ? { ...prev, display_name: trimmed, is_profile_active: true } : prev
      );
      setEditing(false);
    } catch (err: any) {
      setNameError(err.message || "Failed to save name");
    } finally {
      setSaving(false);
    }
  };

  const resetOtpState = () => {
    setOtpModalOpen(false);
    setOtpEmail("");
    setOtpCode("");
    setOtpSent(false);
    setOtpLoading(false);
    setOtpError("");
  };

  const sendOtp = async () => {
    const trimmed = otpEmail.trim().toLowerCase();
    if (trimmed !== (student?.email || "").toLowerCase()) {
      setOtpError("This email doesn't match the one on your profile.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
    });
    setOtpLoading(false);
    if (error) {
      setOtpError(error.message);
      return;
    }
    setOtpSent(true);
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    console.log("Verifying OTP:", { email: otpEmail.trim(), token: otpCode.trim(), type: "magiclink" });
    const { data, error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    console.log("OTP response:", data, error);
    setOtpLoading(false);
    if (error) {
      setOtpError("Invalid or expired code. Please try again.");
      return;
    }
    setOtpVerified(true);
    setOtpModalOpen(false);
    setEditing(true);
  };

  const handleEditClick = () => {
    if (otpVerified) {
      setEditing(true);
    } else {
      setOtpModalOpen(true);
    }
  };

  const handleSeatApplication = () => {
    setSeatSubmitting(true);
    setTimeout(() => {
      const url = new URL(STRIPE_PAYMENT_URL);
      if (student?.email) url.searchParams.set("prefilled_email", student.email);
      window.location.href = url.toString();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <Navbar />

      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="animate-pulse text-muted-foreground">Loading profile…</div>
            </div>
          )}

          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Profile Not Found
              </h2>
              <p className="text-muted-foreground">
                The student profile you're looking for doesn't exist.
              </p>
            </motion.div>
          )}

          {student && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="card-cyber p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {student.profile_image_url ? (
                      <img
                        src={student.profile_image_url}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Shield className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => {
                              setEditName(e.target.value);
                              setNameError("");
                            }}
                            autoFocus
                            placeholder="Your full professional name"
                            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            disabled={saving}
                            className="gap-1"
                          >
                            {saving ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(false);
                              setEditName(student.display_name || student.full_name || "");
                              setNameError("");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {nameError && (
                          <p className="text-xs text-red-400">{nameError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-foreground truncate">
                          {name}
                        </h1>
                        <button
                          onClick={handleEditClick}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit your name"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {student.country && (
                      <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                        <Globe className="h-4 w-4" />
                        {student.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Profile */}
              <div className="card-cyber p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {student.target_role && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Target Role</p>
                      <p className="text-foreground">{student.target_role}</p>
                    </div>
                  )}
                  {student.journey_level && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Journey Level</p>
                      <p className="text-foreground">{student.journey_level}</p>
                    </div>
                  )}
                  {student.weekly_hours && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Weekly Hours</p>
                      <p className="text-foreground">{student.weekly_hours}</p>
                    </div>
                  )}
                  {student.certifications && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground mb-0.5">Certifications Pursuing</p>
                      <p className="text-foreground">{student.certifications}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Your Assigned Mentor */}
              <div className="card-cyber p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Your Assigned Mentor
                </h2>

                {mentor ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground text-base">
                        {mentor.trainer_name || "Your Trainer"}
                      </p>
                      {mentor.trainer_expertise && mentor.trainer_expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {mentor.trainer_expertise.map((skill, i) => (
                            <span
                              key={i}
                              className="inline-flex px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {mentor.trainer_email && (
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <a href={`mailto:${mentor.trainer_email}`}>
                          <Mail className="h-4 w-4" />
                          Contact Mentor
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No mentor has been assigned yet. Please check back soon!
                  </p>
                )}
              </div>

              {/* Earned Certifications */}
              {Array.isArray(student.student_certifications) &&
                student.student_certifications.length > 0 && (
                  <div className="card-cyber p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-cyber-amber" />
                      Earned Certifications
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {student.student_certifications.map((c, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyber-amber/10 border border-cyber-amber/30"
                        >
                          <Award className="h-3.5 w-3.5 text-cyber-amber" />
                          <span className="text-sm font-medium text-cyber-amber">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Exclusive AI Access */}
              <div className="card-cyber p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/5 via-transparent to-primary/5" />
                <div className="relative">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyber-purple" />
                    Exclusive AI Access
                  </h2>

                  <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-5 w-5 text-cyber-purple" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Claude Pro</p>
                        <p className="text-xs text-muted-foreground">
                          Enterprise-grade AI workspace for cybersecurity students
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-cyber-purple mt-0.5">&#x2728;</span>
                        <span>
                          <strong className="text-foreground">Exclusive Invitation:</strong> As a verified student, you are eligible to claim one of our <strong className="text-foreground">20 exclusive Elite AI seats</strong>.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyber-purple mt-0.5">&#x2022;</span>
                        <span>
                          Standard Enterprise-grade licenses are <strong className="text-foreground">$30+ USD/month</strong>, but you can unlock this power for just <strong className="text-foreground">$8/month</strong>—a 75% professional discount.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyber-purple mt-0.5">&#x2022;</span>
                        <span>
                          Click below to secure your spot; our team will manually provision your access to the private workspace shortly after verification.
                        </span>
                      </li>
                    </ul>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10"
                      onClick={() => setSeatModalOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Claim My Elite AI Seat ($8/mo)
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Seat Application Modal */}
      <Dialog
        open={seatModalOpen}
        onOpenChange={(open) => {
          if (!seatSubmitting) {
            setSeatModalOpen(open);
            if (!open) {
              setStudyGoal("");
              setTermsAgreed(false);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-cyber-purple/30 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyber-purple" />
              Claim Your Elite AI Seat
            </DialogTitle>
            <DialogDescription>
              Complete this short application to secure your spot
            </DialogDescription>
          </DialogHeader>

          {seatSubmitting ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-cyber-purple animate-spin" />
              </div>
              <div>
                <p className="font-medium text-foreground">Processing Application...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Redirecting you to secure payment
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prefilled Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={student?.email || ""}
                  readOnly
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Study Goal */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Briefly describe your current study goal and how this AI will help you
                </label>
                <textarea
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  placeholder="e.g., I'm preparing for the CompTIA Security+ exam and need help with practice questions and concept explanations..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyber-purple/50 focus:border-cyber-purple/50 resize-none"
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border bg-background text-cyber-purple focus:ring-cyber-purple/50 accent-[hsl(var(--cyber-purple))]"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the <strong className="text-foreground">Professional Terms of Use</strong> for the Elite AI workspace.
                </span>
              </label>

              {/* Submit */}
              <Button
                className="w-full gap-2 bg-cyber-purple hover:bg-cyber-purple/90 text-white"
                disabled={!studyGoal.trim() || !termsAgreed}
                onClick={handleSeatApplication}
              >
                <Lock className="h-4 w-4" />
                Secure My Seat — $8/mo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog
        open={otpModalOpen}
        onOpenChange={(open) => {
          if (!otpLoading) {
            if (!open) resetOtpState();
            else setOtpModalOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-primary/30 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              To edit your profile, confirm your email address.
            </DialogDescription>
          </DialogHeader>

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Email address on file
                </label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => {
                    setOtpEmail(e.target.value);
                    setOtpError("");
                  }}
                  placeholder="Enter your email"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {otpError && (
                <p className="text-xs text-red-400">{otpError}</p>
              )}
              <Button
                className="w-full gap-2"
                disabled={otpLoading || !otpEmail.trim()}
                onClick={sendOtp}
              >
                {otpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {otpLoading ? "Sending..." : "Send Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Code sent to <strong className="text-foreground">{otpEmail.trim()}</strong>
              </p>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  8-digit code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8));
                    setOtpError("");
                  }}
                  placeholder="000000"
                  maxLength={8}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {otpError && (
                <p className="text-xs text-red-400">{otpError}</p>
              )}
              <Button
                className="w-full gap-2"
                disabled={otpLoading || otpCode.length < 6}
                onClick={verifyOtp}
              >
                {otpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {otpLoading ? "Verifying..." : "Verify"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setOtpError("");
                }}
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Resend code
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
