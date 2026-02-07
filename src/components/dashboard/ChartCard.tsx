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
}

const CHART_COLORS = [
  "hsl(192, 91%, 52%)",  // cyber-glow
  "hsl(270, 70%, 60%)",  // cyber-purple
  "hsl(142, 76%, 46%)",  // cyber-green
  "hsl(38, 92%, 50%)",   // cyber-amber
  "hsl(350, 89%, 60%)",  // cyber-rose
  "hsl(200, 80%, 50%)",
  "hsl(160, 70%, 45%)",
  "hsl(300, 60%, 55%)",
];

export function ChartCard({ title, data, total, horizontal = true, delay = 0, height = 220 }: ChartCardProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
          <p className="text-xs font-medium text-foreground">{item.fullName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.value} responses ({getPercentage(item.value, total)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-cyber p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">Count</span>
      </div>

      <div className="chart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {horizontal ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(210, 40%, 98%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(217, 33%, 17%, 0.5)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="hsl(215, 20%, 55%)"
                  fontSize={11}
                  formatter={(value: number) => `${value} (${getPercentage(value, total)}%)`}
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(210, 40%, 98%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(217, 33%, 17%, 0.5)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="hsl(215, 20%, 55%)"
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
