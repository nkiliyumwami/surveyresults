import { useState, useMemo } from "react";
import { Users, Globe, Briefcase, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  surveyResponses,
  normalizeCountry,
  getShortLabel,
  countBy,
  mapToSortedPairs,
  top1,
  getPercentage,
  getLastUpdated,
} from "@/data/surveyData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar, Filters } from "@/components/dashboard/FilterBar";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { SuggestionsPanel } from "@/components/dashboard/SuggestionsPanel";
import { SharePanel } from "@/components/dashboard/SharePanel";

const Index = () => {
  const [filters, setFilters] = useState<Filters>({
    country: "",
    journey: "",
    role: "",
    time: "",
  });

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const journeys = new Set<string>();
    const roles = new Set<string>();
    const times = new Set<string>();

    surveyResponses.forEach((r) => {
      countries.add(normalizeCountry(r.country));
      journeys.add(r.journey.trim());
      roles.add(r.role.trim());
      times.add(r.time.trim());
    });

    return {
      countries: [...countries].sort(),
      journeys: [...journeys].sort(),
      roles: [...roles].sort(),
      times: [...times].sort(),
    };
  }, []);

  // Filter responses
  const filteredResponses = useMemo(() => {
    return surveyResponses.filter((r) => {
      const normalizedCountry = normalizeCountry(r.country);
      if (filters.country && filters.country !== "all" && normalizedCountry !== filters.country) return false;
      if (filters.journey && filters.journey !== "all" && r.journey.trim() !== filters.journey) return false;
      if (filters.role && filters.role !== "all" && r.role.trim() !== filters.role) return false;
      if (filters.time && filters.time !== "all" && r.time.trim() !== filters.time) return false;
      return true;
    });
  }, [filters]);

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
        if (cleaned) {
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
    const { total, byRole, byRoadblock, topRole, topRoadblock, countryCount } = metrics;
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

    const itPros = filteredResponses.filter((r) => r.journey.includes("IT Professional")).length;
    if (itPros > 0) {
      const pct = getPercentage(itPros, total);
      result.push(`<strong>${itPros} IT professionals</strong> (${pct}%) are looking to pivot into security`);
    }

    const beginners = filteredResponses.filter((r) => r.journey.includes("Absolute Beginner")).length;
    if (beginners > 0) {
      const pct = getPercentage(beginners, total);
      result.push(`<strong>${beginners} absolute beginners</strong> (${pct}%) are starting their security journey`);
    }

    const accelerated = filteredResponses.filter((r) => r.time.includes("10+")).length;
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

  const lastUpdated = getLastUpdated();

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[500px] w-[400px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <main className="relative mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
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
            horizontal={false}
            delay={0.8}
            height={200}
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
            Cybersecurity Mentorship Survey Dashboard
          </p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Index;
