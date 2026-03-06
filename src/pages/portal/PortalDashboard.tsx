import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
  LogOut,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { getPortalToken } from "@/lib/portalApi";
import { cn } from "@/lib/utils";

const TG_BOT = import.meta.env.VITE_ICCA_TG_BOT;
const TRIAL_DAYS = 7;

function PageLoader() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    </div>
  );
}

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { student, creds, loading, logout } = usePortalAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !getPortalToken()) {
      navigate("/portal/login", { replace: true });
    }
  }, [loading, navigate]);

  // Redirect admin to admin console
  useEffect(() => {
    if (!loading && student && student.role === "admin") {
      navigate("/portal/admin", { replace: true });
    }
  }, [loading, student, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!student) return;

    const tick = () => {
      const now = Date.now();
      const end = new Date(student.expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [student]);

  const copyToClipboard = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  if (loading) return <PageLoader />;
  if (!student || !creds) return null;

  const totalMs = TRIAL_DAYS * 86400000;
  const remaining = Math.max(0, new Date(student.expiresAt).getTime() - Date.now());
  const percentage = Math.round((remaining / totalMs) * 100);

  const progressColor =
    percentage > 25
      ? "bg-cyber-green"
      : percentage > 10
        ? "bg-cyber-amber"
        : "bg-destructive";

  const sshOneLiner = `ssh ${creds.sshUser}@${creds.host} -p ${creds.sshPort}`;

  const credentialRows = [
    { label: "Host", value: creds.host, key: "host" },
    { label: "Port", value: String(creds.sshPort), key: "port" },
    { label: "Username", value: creds.sshUser, key: "user" },
    {
      label: "Password",
      value: creds.sshPass,
      key: "pass",
      masked: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Greeting card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="card-cyber p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Hello,{" "}
                    <span className="text-gradient-cyber">{student.name}</span>{" "}
                    <span role="img" aria-label="alien">👾</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Welcome to your OpenClaw training environment
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {student.status === "running" ? (
                    <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cyber-green animate-pulse" />
                      Running
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-destructive" />
                      {student.status}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout();
                      navigate("/portal/login");
                    }}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Trial Timer card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card-cyber p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Trial Remaining
                </h2>
              </div>

              {expired ? (
                <p className="text-2xl font-bold text-destructive font-mono">
                  Trial ended
                </p>
              ) : (
                <>
                  <p className="font-mono text-4xl font-bold text-foreground">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
                    {timeLeft.seconds}s
                  </p>
                  <div className="mt-4 relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progressColor
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {percentage}% of {TRIAL_DAYS}-day trial remaining
                  </p>
                </>
              )}
            </motion.div>

            {/* SSH Credentials card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card-cyber p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  SSH Credentials
                </h2>
                <Badge variant="outline">OpenClaw</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {credentialRows.map((row) => (
                  <div key={row.key} className="space-y-1">
                    <p className="kpi-label">{row.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">
                        {row.masked && !showPassword
                          ? "••••••••"
                          : row.value}
                      </span>
                      {row.masked && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={showPassword ? "Hide" : "Reveal"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(row.value, row.key)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy"
                      >
                        {copiedField === row.key ? (
                          <Check className="h-3.5 w-3.5 text-cyber-green" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SSH one-liner */}
              <div className="mt-6 flex items-center gap-2 rounded-md bg-muted p-3">
                <code className="flex-1 font-mono text-sm text-cyber-green truncate">
                  $ {sshOneLiner}
                </code>
                <button
                  onClick={() => copyToClipboard(sshOneLiner, "oneliner")}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy command"
                >
                  {copiedField === "oneliner" ? (
                    <Check className="h-3.5 w-3.5 text-cyber-green" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Telegram card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card-cyber p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Telegram
                </h2>
              </div>

              {student.telegramLinked ? (
                <p className="text-sm text-cyber-green">
                  <span role="img" aria-label="check">✅</span> Linked (@{student.telegramUsername})
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Link your Telegram account to receive SSH credentials and
                    trial notifications.
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>
                      Open{" "}
                      {TG_BOT ? (
                        <a
                          href={TG_BOT}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          @ICCABot
                        </a>
                      ) : (
                        "@ICCABot"
                      )}{" "}
                      on Telegram
                    </li>
                    <li>
                      Send{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                        /link {student.username} your-password
                      </code>
                    </li>
                  </ol>
                </div>
              )}
            </motion.div>

            {/* Admin quick actions */}
            {student.role === "admin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card-cyber p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Quick Actions
                  </h2>
                </div>
                <Button
                  variant="outline"
                  className="w-full cyber-border"
                  onClick={() => navigate("/portal/admin")}
                >
                  Open Admin Console
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
