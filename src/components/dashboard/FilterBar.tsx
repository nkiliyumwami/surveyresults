import { motion } from "framer-motion";
import { Filter, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface Filters {
  country: string;
  journey: string;
  role: string;
  time: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onReset: () => void;
  countries: string[];
  journeys: string[];
  roles: string[];
  times: string[];
  getShortLabel: (label: string) => string;
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  countries,
  journeys,
  roles,
  times,
  getShortLabel,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card-cyber p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Filter Results</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Country</label>
          <Select value={filters.country} onValueChange={(v) => onFilterChange("country", v)}>
            <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Journey Stage</label>
          <Select value={filters.journey} onValueChange={(v) => onFilterChange("journey", v)}>
            <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {journeys.map(j => (
                <SelectItem key={j} value={j}>{getShortLabel(j)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Dream Role</label>
          <Select value={filters.role} onValueChange={(v) => onFilterChange("role", v)}>
            <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => (
                <SelectItem key={r} value={r}>{getShortLabel(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Time Commitment</label>
          <Select value={filters.time} onValueChange={(v) => onFilterChange("time", v)}>
            <SelectTrigger className="h-9 bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="All Commitments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commitments</SelectItem>
              {times.map(t => (
                <SelectItem key={t} value={t}>{getShortLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
