import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, Globe, Briefcase, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import {
  SurveyResponse,
  normalizeCountry,
  getShortLabel,
  countBy,
  mapToSortedPairs,
  top1,
  getPercentage,
} from "@/data/surveyData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar, Filters } from "@/components/dashboard/FilterBar";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SuggestionsPanel } from "@/components/dashboard/SuggestionsPanel";
import { SharePanel } from "@/components/dashboard/SharePanel";

const API_URL = 'https://script.google.com/macros/s/AKfycbyBIkLx7lvdgtzasUZChLlo--wf0fb8FYaUH9fwvz5A6aAy7NhT1dmEvACpMAkk6nmDNw/exec';
const REFRESH_INTERVAL = 60000; // 60 seconds

interface ApiResponse {
  ok: boolean;
  updatedAt: string;
  total: number;
  responses: SurveyResponse[];
}

async function fetchJsonSafely<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  const contentType = response.headers.get("content-type");
  
  if (!contentType?.includes("application/json")) {
    const textResponse = await response.text();
    console.error("Expected JSON but got:", contentType);
    console.error("Response preview:", textResponse.substring(0, 200));
    
    if (textResponse.trim().startsWith("<!") || textResponse.includes("<html")) {
      throw new Error(
        `API returned HTML instead of JSON. Status: ${response.status}`
      );
    }
    
    throw new Error(`Unexpected response format: ${contentType}`);
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  return response.json();
}

const Index = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("—");
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    country: "",
    journey: "",
    role: "",
    time: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchJsonSafely<ApiResponse>(API_URL);
      
      if (!data.ok || !data.responses) {
        throw new Error("Invalid API response structure");
      }
      
      setSurveyResponses(data.responses);
      setLastUpdated(
        data.updatedAt 
          ? new Date(data.updatedAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date().toLocaleString()
      );
      setIsLive(true);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const journeys = new Set<string>();
    const roles = new Set<string>();
    const times = new Set<string>();

    surveyResponses.forEach((r) => {
      countries.add(normalizeCountry(r.country));
      journeys.add((r.journey || "").trim());
      roles.add((r.role || "").trim());
      times.add((r.time || "").trim());
    });

    return {
      countries: [...countries].filter(Boolean).sort(),
      journeys: [...journeys].filter(Boolean).sort(),
      roles: [...roles].filter(Boolean).sort(),
      times: [...times].filter(Boolean).sort(),
    };
  }, [surveyResponses]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    return surveyResponses.filter((r) => {
      const normalizedCountry = normalizeCountry(r.country);
      if (filters.country && filters.country !== "all" && normalizedCountry !== filters.country) return false;
      if (filters.journey && filters.journey !== "all" && (r.journey || "").trim() !== filters.journey) return false;
      if (filters.role && filters.role !== "all" && (r.role || "").trim() !== filters.role) return false;
      if (filters.time && filters.time !== "all" && (r.time || "").trim() !== filters.time) return false;
      return true;
    });
  }, [surveyResponses, filters]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = filteredResponses.length;
    const byCountry = countBy(filteredResponses, (r) => normalizeCountry(r.country));
    const byRole = countBy(filteredResponses, (r) => r.role);
    const byRoadblock = countBy(filteredResponses, (r) => r.roadblock);
    const byJourney = countBy(filteredResponses, (r) => r.journey);
    const byTime = countBy(filteredResponses, (r) => r.time);

    const topCountry = top1(byCountry);
    const topRole = top1(byRole);
    const topRoadblock = top1(byRoadblock);

    // Certifications
    const certMap = new Map<string, number>();
    filteredResponses.forEach((r) => {
      if (!r.certs) return;
      r.certs.split(",").forEach((cert) => {
        const cleaned = cert.trim();
        if (cleaned && cleaned.toLowerCase() !== "not sure yet") {
          certMap.set(cleaned, (certMap.get(cleaned) || 0) + 1);
        }
      });
    });

    return {
      total,
      byCountry,
      byRole,
      byRoadblock,
      byJourney,
      byTime,
      certMap,
      topCountry,
      topRole,
      topRoadblock,
      countryCount: byCountry.size,
    };
  }, [filteredResponses]);

  // Generate insights
  const insights = useMemo(() => {
    const { total, topRole, topRoadblock, countryCount } = metrics;
    const result: string[] = [];

    if (topRole.value > 0) {
      const pct = getPercentage(topRole.value, total);
      result.push(
        `<strong>${getShortLabel(topRole.label)}</strong> roles dominate interest with ${topRole.value} responses (${pct}%)`
      );
    }

    if (topRoadblock.value > 0) {
      const pct = getPercentage(topRoadblock.value, total);
      result.push(
        `"<strong>${getShortLabel(topRoadblock.label)}</strong>" is the most common challenge (${pct}%)`
      );
    }

    const itPros = filteredResponses.filter((r) => (r.journey || "").includes("IT Professional")).length;
    if (itPros > 0) {
      const pct = getPercentage(itPros, total);
      result.push(`<strong>${itPros} IT professionals</strong> (${pct}%) are looking to pivot into security`);
    }

    const beginners = filteredResponses.filter((r) => (r.journey || "").includes("Absolute Beginner")).length;
    if (beginners > 0) {
      const pct = getPercentage(beginners, total);
      result.push(`<strong>${beginners} absolute beginners</strong> (${pct}%) are starting their security journey`);
    }

    const accelerated = filteredResponses.filter((r) => (r.time || "").includes("10+")).length;
    if (accelerated > 0) {
      const pct = getPercentage(accelerated, total);
      result.push(
        `<strong>${accelerated} respondents</strong> (${pct}%) commit 10+ hours weekly—highly motivated learners`
      );
    }

    if (countryCount > 1) {
      result.push(`Responses come from <strong>${countryCount} different countries</strong>, showing global interest`);
    }

    return result.slice(0, 5);
  }, [metrics, filteredResponses]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const { byJourney, byRole, byRoadblock, byTime, byCountry, certMap } = metrics;

    const toChartData = (map: Map<string, number>, limit?: number) => {
      const pairs = mapToSortedPairs(map, limit);
      return pairs.map(([label, value]) => ({
        name: getShortLabel(label),
        value,
        fullName: label,
      }));
    };

    return {
      journey: toChartData(byJourney),
      role: toChartData(byRole),
      roadblock: toChartData(byRoadblock),
      time: toChartData(byTime),
      country: toChartData(byCountry),
      certs: toChartData(certMap, 10),
    };
  }, [metrics]);

  // Summary text for clipboard
  const summaryText = useMemo(() => {
    const { total, topCountry, topRole, topRoadblock } = metrics;
    return `CYBERSECURITY MENTORSHIP SURVEY SUMMARY
==========================================

📊 KEY METRICS
• Total Responses: ${total}
• Top Country: ${topCountry.label} (${topCountry.value} responses)
• Top Dream Role: ${getShortLabel(topRole.label)} (${topRole.value} responses)
• Top Roadblock: ${getShortLabel(topRoadblock.label)} (${topRoadblock.value} responses)

💡 KEY INSIGHTS
${insights.map((i) => "• " + i.replace(/<\/?strong>/g, "")).join("\n")}

==========================================
Generated from Cybersecurity Mentorship Survey Dashboard`;
  }, [metrics, insights]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ country: "", journey: "", role: "", time: "" });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm">Loading live data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Live Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between"
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isLive ? 'bg-cyber-green/10 border border-cyber-green/30' : 'bg-cyber-amber/10 border border-cyber-amber/30'}`}>
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-cyber-green" />
                <span className="text-xs text-cyber-green font-medium">Live • auto-refresh 60s</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-cyber-amber" />
                <span className="text-xs text-cyber-amber font-medium">Offline</span>
              </>
            )}
          </div>
          {error && (
            <div className="text-xs text-cyber-amber bg-cyber-amber/10 px-3 py-1.5 rounded-lg border border-cyber-amber/30">
              {error}
            </div>
          )}
        </motion.div>

        {/* Header */}
        <DashboardHeader
          totalResponses={metrics.total}
          topCountry={metrics.topCountry.label}
          topRole={getShortLabel(metrics.topRole.label)}
          topRoadblock={getShortLabel(metrics.topRoadblock.label)}
          countryCount={metrics.countryCount}
          lastUpdated={lastUpdated}
        />

        {/* Filters */}
        <div className="mt-4 sm:mt-6">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            countries={filterOptions.countries}
            journeys={filterOptions.journeys}
            roles={filterOptions.roles}
            times={filterOptions.times}
            getShortLabel={getShortLabel}
          />
        </div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4"
        >
          <KPICard
            title="Total Responses"
            value={metrics.total}
            icon={Users}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            delay={0.2}
            isNumeric
          />
          <KPICard
            title="Top Country"
            value={metrics.topCountry.label}
            subtitle={`${metrics.topCountry.value} of ${metrics.total}`}
            icon={Globe}
            iconColor="text-cyber-green"
            iconBg="bg-cyber-green/10"
            delay={0.3}
          />
          <KPICard
            title="Top Dream Role"
            value={getShortLabel(metrics.topRole.label)}
            subtitle={`${metrics.topRole.value} of ${metrics.total}`}
            icon={Briefcase}
            iconColor="text-cyber-purple"
            iconBg="bg-cyber-purple/10"
            delay={0.4}
          />
          <KPICard
            title="Top Roadblock"
            value={getShortLabel(metrics.topRoadblock.label)}
            subtitle={`${metrics.topRoadblock.value} of ${metrics.total}`}
            icon={AlertTriangle}
            iconColor="text-cyber-amber"
            iconBg="bg-cyber-amber/10"
            delay={0.5}
          />
        </motion.div>

        {/* Insights */}
        <div className="mt-4 sm:mt-6">
          <InsightsPanel insights={insights} delay={0.3} />
        </div>

        {/* Charts Grid */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ChartCard
            title="Journey Stage Distribution"
            data={chartData.journey}
            total={metrics.total}
            delay={0.4}
            height={200}
          />
          <ChartCard
            title="Dream Role Preferences"
            data={chartData.role}
            total={metrics.total}
            delay={0.5}
            height={180}
          />
          <ChartCard
            title="Biggest Roadblocks"
            data={chartData.roadblock}
            total={metrics.total}
            delay={0.6}
            height={180}
          />
          <ChartCard
            title="Weekly Time Commitment"
            data={chartData.time}
            total={metrics.total}
            delay={0.7}
            height={160}
          />
        </div>

        {/* Country Chart - Full Width */}
        <div className="mt-4 sm:mt-6">
          <ChartCard
            title="Country Distribution"
            data={chartData.country}
            total={metrics.total}
            delay={0.8}
            height={Math.min(Math.max(200, chartData.country.length * 26 + 60), 520)}
            labelMaxLength={24}
            yAxisWidth={150}
            tooltipMode="compact"
          />
        </div>

        {/* Certifications Chart - Full Width */}
        <div className="mt-4 sm:mt-6">
          <ChartCard
            title="Top Certification Interests"
            data={chartData.certs}
            total={metrics.total}
            horizontal={false}
            delay={0.9}
            height={280}
          />
        </div>

        {/* Share Panel */}
        <div className="mt-4 sm:mt-6">
          <SharePanel summaryText={summaryText} delay={1.0} />
        </div>

        {/* Suggestions */}
        <div className="mt-4 sm:mt-6">
          <SuggestionsPanel responses={filteredResponses} delay={1.1} />
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-6 sm:mt-10 pb-6 sm:pb-8 text-center"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Cybersecurity Mentorship Survey Dashboard • {metrics.total} responses
          </p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Index;
