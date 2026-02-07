import { motion } from "framer-motion";
import { Printer, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SharePanelProps {
  summaryText: string;
  delay?: number;
}

export function SharePanel({ summaryText, delay = 0 }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-cyber p-3 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold text-foreground">Share & Export</h2>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
            Download or share this dashboard
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3"
          >
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Print / PDF</span>
            <span className="sm:hidden">Print</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 sm:px-3"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Copy Summary</span>
                <span className="sm:hidden">Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
