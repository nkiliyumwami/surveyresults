import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Globe,
  ClipboardList,
  UserPlus,
  BookOpen,
  Award,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { WorldMap } from "@/components/dashboard/WorldMap";
import { normalizeCountry } from "@/data/surveyData";
import { supabase } from "@/lib/supabase";

const API_URL =
  "https://script.google.com/macros/s/AKfycbywhbeuCk2v3wKAHrN_fv6wD5ZzHxvRnjhUlmaIHLk16BS-ICYRnxh5t9_89te6QluPCQ/exec";

const SURVEY_URL = "https://forms.gle/Mf4Jj7jZK9iRrUDY8";

interface CountryData {
  country: string;
  count: number;
}

export default function LandingPage() {
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [stats, setStats] = useState({ students: 0, trainers: 0 });
  const [loading, setLoading] = useState(true);

  // --- Find Your Trainer ---
  const [trainerSearchEmail, setTrainerSearchEmail] = useState("");
  const [trainerSearching, setTrainerSearching] = useState(false);
  const [trainerResult, setTrainerResult] = useState<{
    studentName: string;
    trainerName: string;
    trainerEmail: string;
  } | null>(null);
  const [trainerSearchError, setTrainerSearchError] = useState<string | null>(null);

  async function handleTrainerSearch(e: React.FormEvent) {
    e.preventDefault();
    const emailTrimmed = trainerSearchEmail.trim().toLowerCase();
    if (!emailTrimmed) return;

    setTrainerSearching(true);
    setTrainerResult(null);
    setTrainerSearchError(null);

    try {
      const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("email", emailTrimmed)
        .maybeSingle();

      if (studentErr) throw studentErr;
      if (!student) {
        setTrainerSearchError("No student found with that email. Please check and try again.");
        return;
      }

      const { data: assignment, error: assignErr } = await supabase
        .from("assignments")
        .select("trainer:trainer_profiles(full_name, email, is_active)")
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle();

      if (assignErr) throw assignErr;

      const trainer = assignment?.trainer as {
        full_name: string | null;
        email: string | null;
        is_active: boolean;
      } | null;

      if (!assignment || !trainer || !trainer.is_active) {
        setTrainerSearchError("No active trainer assignment found yet. Please check back soon!");
        return;
      }

      setTrainerResult({
        studentName: student.full_name || emailTrimmed,
        trainerName: trainer.full_name || "Your Trainer",
        trainerEmail: trainer.email || "—",
      });
    } catch (err: any) {
      console.error("Trainer search error:", err);
      setTrainerSearchError("Something went wrong. Please try again.");
    } finally {
      setTrainerSearching(false);
    }
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch survey responses (students) from Google Sheets API
        const surveyRes = await fetch(API_URL);
        const surveyData = await surveyRes.json();

        let studentCount = 0;
        if (surveyData.ok && surveyData.responses) {
          studentCount = surveyData.responses.length;

          // Count responses by normalized country
          const countryMap = new Map<string, number>();
          surveyData.responses.forEach((r: { location: string }) => {
            const normalized = normalizeCountry(r.location);
            if (normalized !== "Unknown") {
              countryMap.set(normalized, (countryMap.get(normalized) || 0) + 1);
            }
          });

          // Convert to array format for WorldMap
          const data: CountryData[] = Array.from(countryMap.entries()).map(
            ([country, count]) => ({ country, count })
          );
          setCountryData(data);
        }

        // Fetch active trainers count from Supabase
        const { count: trainerCount } = await supabase
          .from("trainer_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setStats({
          students: studentCount,
          trainers: trainerCount || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Free Cybersecurity Mentorship Program
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Bridging the{" "}
              <span className="text-gradient-cyber">Cybersecurity</span>
              <br />
              Skills Gap
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connecting aspiring security professionals with experienced mentors.
              Get personalized guidance on your journey into cybersecurity.
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-6"
                asChild
              >
                <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Join our community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 py-6"
                asChild
              >
                <Link to="/trainer/login">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Become a Trainer
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden p-1">
              <div className="rounded-lg bg-background/50 p-6 sm:p-8">
                <div className="grid grid-cols-3 gap-4 sm:gap-8">
                  {/* Mini stat cards preview */}
                  {[
                    { icon: Shield, label: "Security Domains", value: "8+" },
                    { icon: Globe, label: "Global Reach", value: "15+" },
                    { icon: Users, label: "Community", value: "Growing" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="text-center p-4 rounded-lg bg-muted/30"
                    >
                      <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-lg font-bold text-foreground">
                        {item.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Find Your Trainer */}
      <section className="relative z-10 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border-2 border-primary/40 bg-secondary p-5 sm:p-6 shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              Find Your Trainer
            </h2>
            <form onSubmit={handleTrainerSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={trainerSearchEmail}
                onChange={(e) => setTrainerSearchEmail(e.target.value)}
                placeholder="Enter your email address…"
                required
                className="flex-1 rounded-md border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <button
                type="submit"
                disabled={trainerSearching || !trainerSearchEmail.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {trainerSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </form>

            {trainerResult && (
              <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3">
                <p className="text-sm text-foreground">
                  Hi <strong>{trainerResult.studentName}</strong>! Your trainer is{" "}
                  <strong>{trainerResult.trainerName}</strong> ({trainerResult.trainerEmail}).
                </p>
              </div>
            )}

            {trainerSearchError && (
              <div className="mt-4 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
                <p className="text-sm text-yellow-200">{trainerSearchError}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive World Map Section */}
      <section className="py-16 sm:py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our Global Community
            </h2>
            <p className="mt-2 text-muted-foreground">
              Real-time data from aspiring security professionals worldwide
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-pulse text-muted-foreground">Loading map...</div>
            </div>
          ) : (
            <WorldMap data={countryData} totalStudents={stats.students} activeTrainers={stats.trainers} />
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 relative bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Simple steps to start your cybersecurity journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Students Path */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-cyber p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  For Students
                </h3>
              </div>

              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Take the Survey",
                    desc: "Share your background, goals, and availability",
                  },
                  {
                    step: "2",
                    title: "Get Matched",
                    desc: "We pair you with a trainer based on your needs",
                  },
                  {
                    step: "3",
                    title: "Learn & Grow",
                    desc: "Receive personalized mentorship and guidance",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-6" asChild>
                <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
                  Start Your Journey
                  <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>

            {/* Trainers Path */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-cyber p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-cyber-purple/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-cyber-purple" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  For Trainers
                </h3>
              </div>

              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Apply to Join",
                    desc: "Create an account and submit your application",
                  },
                  {
                    step: "2",
                    title: "Build Your Profile",
                    desc: "Add your expertise, certifications, and availability",
                  },
                  {
                    step: "3",
                    title: "Mentor Students",
                    desc: "Get matched and help shape the next generation",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center text-sm font-bold text-cyber-purple">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-6" asChild>
                <Link to="/trainer/login">
                  Become a Trainer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-cyber p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyber-purple/5" />
            <div className="relative">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Ready to Start?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Whether you're looking to break into cybersecurity or share your
                expertise, we're here to help you succeed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">
                    Take the Survey
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/dashboard/students">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                CyberMentor
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                to="/dashboard/students"
                className="hover:text-foreground transition-colors"
              >
                Student Dashboard
              </Link>
              <Link
                to="/trainer/login"
                className="hover:text-foreground transition-colors"
              >
                Trainer Portal
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CyberMentor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
