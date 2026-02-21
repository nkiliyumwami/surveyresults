import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a 2-letter ISO country code to its emoji flag (Regional Indicators). */
function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

// ---------------------------------------------------------------------------
// usePageVisit — fire-and-forget visit recording (once per session)
// ---------------------------------------------------------------------------

function usePageVisit() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const SESSION_KEY = "page_visit_recorded";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    (async () => {
      let countryCode: string | null = null;

      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch("https://ipapi.co/json/", {
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const geo = await res.json();
        if (geo?.country_code) countryCode = geo.country_code;
      } catch {
        // geo lookup failed — record visit without country
      }

      try {
        await supabase
          .from("page_visits")
          .insert({ country_code: countryCode });
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // insert failed — non-critical, swallow
      }
    })();
  }, []);
}

// ---------------------------------------------------------------------------
// useLivePresence — Supabase Realtime Presence for live viewer count
// ---------------------------------------------------------------------------

function useLivePresence() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel("online-users", {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({});
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

// ---------------------------------------------------------------------------
// useLiveStats — aggregate queries via RPC
// ---------------------------------------------------------------------------

interface TopCountry {
  country_code: string;
  visit_count: number;
}

function useLiveStats() {
  const [monthlyVisits, setMonthlyVisits] = useState<number | null>(null);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [monthlyRes, countriesRes] = await Promise.all([
          supabase.rpc("get_monthly_visit_count"),
          supabase.rpc("get_top_countries", {
            hours_ago: 24,
            result_limit: 5,
          }),
        ]);

        if (monthlyRes.data != null) setMonthlyVisits(Number(monthlyRes.data));
        if (countriesRes.data) setTopCountries(countriesRes.data as TopCountry[]);
      } catch {
        // non-critical — stats simply won't show
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { monthlyVisits, topCountries, loading };
}

// ---------------------------------------------------------------------------
// LiveStats Component
// ---------------------------------------------------------------------------

export function LiveStats() {
  usePageVisit();
  const liveViewers = useLivePresence();
  const { monthlyVisits, topCountries, loading } = useLiveStats();

  // Nothing to show yet
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="h-12 rounded-xl bg-card/20 animate-pulse" />
      </div>
    );
  }

  const hasMonthly = monthlyVisits != null && monthlyVisits > 0;
  const hasLive = liveViewers > 0;
  const hasCountries = topCountries.length > 0;

  // If all data failed, render nothing
  if (!hasMonthly && !hasLive && !hasCountries) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm cyber-glow-subtle"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-border/30 px-4 py-3 gap-0 text-sm text-muted-foreground">
          {/* Monthly visits */}
          {hasMonthly && (
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0">
              <span>
                Over{" "}
                <strong className="text-foreground">
                  {monthlyVisits!.toLocaleString()}
                </strong>{" "}
                aspiring professionals visited this month
              </span>
            </div>
          )}

          {/* Live viewers */}
          {hasLive && (
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-green" />
              </span>
              <span>
                Currently{" "}
                <strong className="text-foreground">{liveViewers}</strong>{" "}
                {liveViewers === 1 ? "student" : "students"} online
              </span>
            </div>
          )}

          {/* Top countries */}
          {hasCountries && (
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0">
              <span className="flex gap-1">
                {topCountries.map((c) => (
                  <span
                    key={c.country_code}
                    title={c.country_code}
                    className="text-base"
                  >
                    {countryCodeToFlag(c.country_code)}
                  </span>
                ))}
              </span>
              <span>Top visitors today</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
