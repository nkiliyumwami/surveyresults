import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, MapPin, Clock, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SurveyResponse, getShortLabel, normalizeCountry } from "@/data/surveyData";

interface SuggestionsPanelProps {
  responses: SurveyResponse[];
  delay?: number;
}

export function SuggestionsPanel({ responses, delay = 0 }: SuggestionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [commentsOnly, setCommentsOnly] = useState(false);

  const normalize = (s: string) => (s ?? "").toString().trim();
  
  const processedResponses = responses.map(r => ({
    ...r,
    country: normalizeCountry(r.country),
    hasSuggestion: normalize(r.suggestion) && normalize(r.suggestion).toLowerCase() !== "n/a",
  }));

  let filtered = processedResponses;
  
  if (commentsOnly) {
    filtered = filtered.filter(r => r.hasSuggestion);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      (r.suggestion && r.suggestion.toLowerCase().includes(query)) ||
      r.role.toLowerCase().includes(query) ||
      r.country.toLowerCase().includes(query)
    );
  }

  const withComments = processedResponses.filter(r => r.hasSuggestion).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-cyber p-5"
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Suggestions & Requests</h2>
          <Badge variant="secondary" className="ml-2 text-xs">
            {withComments} with comments
          </Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full bg-muted/50 pl-9 text-sm sm:w-56"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={commentsOnly}
              onCheckedChange={(checked) => setCommentsOnly(checked === true)}
            />
            <span>Comments only</span>
          </label>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((r, index) => (
              <motion.div
                key={`${r.timestamp}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Badge className="w-fit bg-primary/20 text-primary hover:bg-primary/30">
                    {getShortLabel(r.role)}
                  </Badge>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {r.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getShortLabel(r.time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {r.timestamp.split(" ")[0]}
                    </span>
                  </div>
                </div>
                {r.hasSuggestion ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {r.suggestion}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-muted-foreground">
                    No comment provided
                  </p>
                )}
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-sm text-muted-foreground"
            >
              No matching suggestions found
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
