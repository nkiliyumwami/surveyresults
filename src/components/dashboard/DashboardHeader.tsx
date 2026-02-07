import { motion } from "framer-motion";
import { Shield, Activity } from "lucide-react";

interface DashboardHeaderProps {
  totalResponses: number;
  topCountry: string;
  topRole: string;
  topRoadblock: string;
  countryCount: number;
  lastUpdated: string;
}

export function DashboardHeader({
  totalResponses,
  topCountry,
  topRole,
  topRoadblock,
  countryCount,
  lastUpdated,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card p-8"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyber-purple/10 blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 cyber-border-glow"
            >
              <Shield className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Cybersecurity Mentorship Survey
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Results Dashboard
              </p>
            </div>
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl text-sm leading-relaxed text-muted-foreground"
          >
            <span className="font-mono text-primary">{totalResponses}</span> responses collected from{" "}
            <span className="font-mono text-primary">{countryCount}</span> countries. 
            Most aspire to <span className="text-foreground">{topRole.toLowerCase()}</span> roles, 
            with "<span className="text-foreground">{topRoadblock.toLowerCase()}</span>" as the primary challenge.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-start gap-2 lg:items-end"
        >
          <div className="rounded-lg border border-border/50 bg-card/50 px-4 py-2 backdrop-blur">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <p className="font-mono text-sm font-medium text-foreground">{lastUpdated}</p>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
