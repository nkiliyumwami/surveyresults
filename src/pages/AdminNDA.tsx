import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "admin_nda_auth";
const ADMIN_PASSWORD = "Habineza@NDA2026";

interface NDAEntry {
  fullName?: string;
  email?: string;
  phone?: string;
  dateSigned?: string;
  comment?: string;
  // tolerate alt field names from Apps Script
  name?: string;
  phoneNumber?: string;
  date?: string;
  timestamp?: string;
  comments?: string;
  [key: string]: unknown;
}

function normalize(entry: NDAEntry) {
  return {
    fullName: String(entry.fullName ?? entry.name ?? "").trim(),
    email: String(entry.email ?? "").trim(),
    phone: String(entry.phone ?? entry.phoneNumber ?? "").trim(),
    dateSigned: String(entry.dateSigned ?? entry.date ?? entry.timestamp ?? "").trim(),
    comment: String(entry.comment ?? entry.comments ?? "").trim(),
  };
}

export default function AdminNDA() {
  const [authed, setAuthed] = useState<boolean>(
    () => sessionStorage.getItem(STORAGE_KEY) === "true"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [entries, setEntries] = useState<ReturnType<typeof normalize>[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
      setPasswordError(null);
    } else {
      setPasswordError("Access denied");
    }
  };

  const fetchList = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/nda-list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Accept either an array or an object with a .list / .data / .entries field
      let list: NDAEntry[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.list)) {
        list = data.list;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.entries)) {
        list = data.entries;
      } else if (Array.isArray(data?.rows)) {
        list = data.rows;
      }

      setEntries(list.map(normalize));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load NDA list");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchList();
  }, [authed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [entries, search]);

  // ---------- Login gate ----------
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-xl border border-border/50 bg-secondary/60 backdrop-blur p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Admin · NDA Report</h1>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Enter the admin password to view signed NDAs.
          </p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Password"
              autoFocus
              className="w-full h-10 px-3 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
            <Button type="submit" className="w-full h-10 text-sm" disabled={!passwordInput}>
              Unlock
            </Button>
            {passwordError && (
              <div className="text-xs text-destructive font-mono text-center pt-1">
                {passwordError}
              </div>
            )}
          </form>
        </motion.div>
      </div>
    );
  }

  // ---------- Report ----------
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />

      <main className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                NDA Signed Report
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {loading
                  ? "// loading…"
                  : `${entries.length} NDA Signed`}
              </p>
            </div>
            <Button
              onClick={fetchList}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* States */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              // loading NDA list...
            </div>
          ) : fetchError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-destructive">Failed to load</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{fetchError}</div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              // no entries found
            </div>
          ) : (
            <div className="card-cyber overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      <th className="px-4 py-3 text-left w-12">#</th>
                      <th className="px-4 py-3 text-left">Full Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">Date Signed</th>
                      <th className="px-4 py-3 text-left">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr
                        key={`${e.email}-${i}`}
                        className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {e.fullName || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {e.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {e.phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {e.dateSigned || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs">
                          {e.comment || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
