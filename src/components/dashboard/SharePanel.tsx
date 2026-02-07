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
      className="card-cyber p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Share & Export</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Download or share this dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="h-9 gap-2"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Summary
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
