import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: string[];
  delay?: number;
}

export function InsightsPanel({ insights, delay = 0 }: InsightsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-cyber relative overflow-hidden p-4 sm:p-6"
    >
      {/* Gradient accent */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-cyber-purple to-primary/50" />
      
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10">
          <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        <h2 className="text-xs sm:text-sm font-semibold text-foreground">Key Insights</h2>
      </div>

      <ul className="space-y-2 sm:space-y-3">
        {insights.map((insight, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + index * 0.1 }}
            className="insight-bullet text-xs sm:text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: insight }}
          />
        ))}
        {insights.length === 0 && (
          <li className="text-xs sm:text-sm text-muted-foreground italic">
            No insights available for current filters
          </li>
        )}
      </ul>
    </motion.div>
  );
}
