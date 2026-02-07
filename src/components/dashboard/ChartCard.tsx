import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { getPercentage } from "@/data/surveyData";

interface ChartCardProps {
  title: string;
  data: { name: string; value: number; fullName: string }[];
  total: number;
  horizontal?: boolean;
  delay?: number;
  height?: number;

  /** Controls tooltip text format (used to match the standalone HTML dashboard style for Countries). */
  tooltipMode?: "default" | "compact";

  /** Max characters for category labels on the axis before truncation. */
  labelMaxLength?: number;

  /** Horizontal charts only: Y axis width in pixels (helps long labels like countries). */
  yAxisWidth?: number;
}

const CHART_COLORS = [
  "hsl(192, 91%, 52%)", // cyber-glow
  "hsl(270, 70%, 60%)", // cyber-purple
  "hsl(142, 76%, 46%)", // cyber-green
  "hsl(38, 92%, 50%)", // cyber-amber
  "hsl(350, 89%, 60%)", // cyber-rose
  "hsl(200, 80%, 50%)",
  "hsl(160, 70%, 45%)",
  "hsl(300, 60%, 55%)",
  "hsl(220, 70%, 55%)",
  "hsl(280, 65%, 50%)",
];

// Truncate label for display but keep full name for tooltip
function truncateLabel(label: string, maxLength: number = 15): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 2) + "...";
}

export function ChartCard({
  title,
  data,
  total,
  horizontal = true,
  delay = 0,
  height = 220,
  tooltipMode = "default",
  labelMaxLength = 12,
  yAxisWidth = 90,
}: ChartCardProps) {
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;
    const pct = getPercentage(item.value, total);

    if (tooltipMode === "compact") {
      return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl max-w-xs z-50">
          <p className="text-xs font-medium text-foreground break-words">
            {item.fullName}: {item.value} ({pct}%)
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl max-w-xs z-50">
        <p className="text-xs font-medium text-foreground break-words">{item.fullName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.value} responses ({pct}%)
        </p>
      </div>
    );
  };

  // Prepare data with truncated labels for vertical bar charts
  const chartData = horizontal
    ? data
    : data.map((item) => ({
        ...item,
        displayName: truncateLabel(item.name, 12),
      }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-cyber p-3 sm:p-5"
    >
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] sm:text-xs text-muted-foreground">Count</span>
      </div>

      <div className="chart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {horizontal ? (
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(210, 40%, 98%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={yAxisWidth}
                tickFormatter={(value) => truncateLabel(value, labelMaxLength)}
              />
              <Tooltip content={renderTooltip} cursor={{ fill: "hsl(217, 33%, 17%, 0.5)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="hsl(215, 20%, 55%)"
                  fontSize={9}
                  formatter={(value: number) => `${value} (${getPercentage(value, total)}%)`}
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 25, right: 5, left: 5, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
              <XAxis
                dataKey="displayName"
                tick={{ fill: "hsl(210, 40%, 98%)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={renderTooltip} cursor={{ fill: "hsl(217, 33%, 17%, 0.5)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={35}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="top" fill="hsl(215, 20%, 55%)" fontSize={9} />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
