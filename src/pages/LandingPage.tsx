import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Globe,
  UserCheck,
  ClipboardList,
  UserPlus,
  BookOpen,
  Award,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { supabase } from "@/lib/supabase";
import { normalizeCountry } from "@/data/surveyData";

const API_URL =
  "https://script.google.com/macros/s/AKfycbyBIkLx7lvdgtzasUZChLlo--wf0fb8FYaUH9fwvz5A6aAy7NhT1dmEvACpMAkk6nmDNw/exec";

const SURVEY_URL = "https://forms.gle/Mf4Jj7jZK9iRrUDY8";

interface Stats {
  totalResponses: number;
  countriesCount: number;
  activeTrainers: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats>({
    totalResponses: 0,
    countriesCount: 0,
    activeTrainers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch survey responses
        const surveyRes = await fetch(API_URL);
        const surveyData = await surveyRes.json();

        let totalResponses = 0;
        let countriesCount = 0;

        if (surveyData.ok && surveyData.responses) {
          totalResponses = surveyData.responses.length;
          const countries = new Set(
            surveyData.responses.map((r: { country: string }) =>
              normalizeCountry(r.country)
            )
          );
          countries.delete("Unknown");
          countriesCount = countries.size;
        }

        // Fetch active trainers count
        const { count: activeTrainers } = await supabase
          .from("trainer_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setStats({
          totalResponses,
          countriesCount,
          activeTrainers: activeTrainers || 0,
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
                  Take the Survey
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

      {/* Stats Section */}
      <section className="py-16 sm:py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our Impact in Numbers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Real-time data from our growing community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Users,
                value: stats.totalResponses,
                label: "Survey Responses",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Globe,
                value: stats.countriesCount,
                label: "Countries Represented",
                color: "text-cyber-green",
                bg: "bg-cyber-green/10",
              },
              {
                icon: UserCheck,
                value: stats.activeTrainers,
                label: "Active Trainers",
                color: "text-cyber-purple",
                bg: "bg-cyber-purple/10",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-cyber p-6 sm:p-8 text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bg} mb-4`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                  {loading ? (
                    <span className="opacity-50">--</span>
                  ) : (
                    <AnimatedCounter value={stat.value} />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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
