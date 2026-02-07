import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
  isNumeric?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  delay = 0,
  isNumeric = false,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="card-cyber group relative overflow-hidden p-3 sm:p-5"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex items-start gap-3 sm:gap-4">
        <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", iconColor)} />
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="kpi-label mb-1 text-[10px] sm:text-xs">{title}</p>
          <div className="kpi-value text-foreground text-xl sm:text-3xl">
            {isNumeric && typeof value === "number" ? (
              <AnimatedCounter value={value} />
            ) : (
              <motion.span
                key={String(value)}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="block truncate text-base sm:text-lg"
              >
                {value}
              </motion.span>
            )}
          </div>
          {subtitle && (
            <motion.p
              key={subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
