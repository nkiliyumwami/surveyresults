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
      className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-6 lg:p-8"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="absolute -right-10 sm:-right-20 -top-10 sm:-top-20 h-32 sm:h-60 w-32 sm:w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 sm:-bottom-20 -left-10 sm:-left-20 h-32 sm:h-60 w-32 sm:w-60 rounded-full bg-cyber-purple/10 blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/20 cyber-border-glow"
            >
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Cybersecurity Survey
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                Mentorship Results
              </p>
            </div>
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl text-xs sm:text-sm leading-relaxed text-muted-foreground"
          >
            <span className="font-mono text-primary">{totalResponses}</span> responses from{" "}
            <span className="font-mono text-primary">{countryCount}</span> countries. 
            <span className="hidden sm:inline">
              {" "}Most aspire to <span className="text-foreground">{topRole.toLowerCase()}</span> roles, 
              with "<span className="text-foreground">{topRoadblock.toLowerCase()}</span>" as the primary challenge.
            </span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-start lg:items-end"
        >
          <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Updated</span>
            <p className="font-mono text-xs sm:text-sm font-medium text-foreground">{lastUpdated}</p>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
