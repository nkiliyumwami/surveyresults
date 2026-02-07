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
  const hasActiveFilters = Object.values(filters).some(v => v !== "" && v !== "all");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card-cyber p-3 sm:p-5"
    >
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10">
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          </div>
          <h2 className="text-xs sm:text-sm font-semibold text-foreground">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-primary px-2"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Country</label>
          <Select value={filters.country} onValueChange={(v) => onFilterChange("country", v)}>
            <SelectTrigger className="h-8 sm:h-9 bg-muted/50 border-border/50 text-xs sm:text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Journey</label>
          <Select value={filters.journey} onValueChange={(v) => onFilterChange("journey", v)}>
            <SelectTrigger className="h-8 sm:h-9 bg-muted/50 border-border/50 text-xs sm:text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Stages</SelectItem>
              {journeys.map(j => (
                <SelectItem key={j} value={j}>{getShortLabel(j)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Role</label>
          <Select value={filters.role} onValueChange={(v) => onFilterChange("role", v)}>
            <SelectTrigger className="h-8 sm:h-9 bg-muted/50 border-border/50 text-xs sm:text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => (
                <SelectItem key={r} value={r}>{getShortLabel(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Time</label>
          <Select value={filters.time} onValueChange={(v) => onFilterChange("time", v)}>
            <SelectTrigger className="h-8 sm:h-9 bg-muted/50 border-border/50 text-xs sm:text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
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
