import { memo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { Globe, Users, ShieldCheck, FileText } from "lucide-react";

// Use Natural Earth data which has proper country names
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Label display threshold - only show static labels for countries with more than this many responses
const LABEL_THRESHOLD = 3;

// Mapping from world-atlas numeric IDs to country names
// These are ISO 3166-1 numeric codes
const ID_TO_COUNTRY: Record<string, string> = {
  "646": "Rwanda",
  "840": "United States",
  "124": "Canada",
  "643": "Russia",
  "826": "United Kingdom",
  "356": "India",
  "276": "Germany",
  "250": "France",
  "036": "Australia",
  "076": "Brazil",
  "392": "Japan",
  "710": "South Africa",
  "566": "Nigeria",
  "404": "Kenya",
  "288": "Ghana",
  "818": "Egypt",
  "504": "Morocco",
  "834": "Tanzania",
  "800": "Uganda",
  "231": "Ethiopia",
  "156": "China",
  "484": "Mexico",
  "032": "Argentina",
  "170": "Colombia",
  "152": "Chile",
  "604": "Peru",
  "528": "Netherlands",
  "056": "Belgium",
  "752": "Sweden",
  "578": "Norway",
  "208": "Denmark",
  "246": "Finland",
  "616": "Poland",
  "724": "Spain",
  "380": "Italy",
  "620": "Portugal",
  "372": "Ireland",
  "756": "Switzerland",
  "040": "Austria",
  "554": "New Zealand",
  "702": "Singapore",
  "458": "Malaysia",
  "360": "Indonesia",
  "608": "Philippines",
  "764": "Thailand",
  "704": "Vietnam",
  "586": "Pakistan",
  "050": "Bangladesh",
  "144": "Sri Lanka",
  "784": "United Arab Emirates",
  "682": "Saudi Arabia",
  "376": "Israel",
  "792": "Turkey",
  "300": "Greece",
  "203": "Czech Republic",
  "348": "Hungary",
  "642": "Romania",
  "804": "Ukraine",
};

// Country centroid coordinates for label positioning [longitude, latitude]
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  "Rwanda": [29.8739, -1.9403],
  "United States": [-98.5795, 39.8283],
  "Canada": [-106.3468, 56.1304],
  "Russia": [105.3188, 61.524],
  "United Kingdom": [-3.436, 55.3781],
  "India": [78.9629, 20.5937],
  "Germany": [10.4515, 51.1657],
  "France": [2.2137, 46.2276],
  "Australia": [133.7751, -25.2744],
  "Brazil": [-51.9253, -14.235],
  "Japan": [138.2529, 36.2048],
  "South Africa": [22.9375, -30.5595],
  "Nigeria": [8.6753, 9.082],
  "Kenya": [37.9062, -0.0236],
  "Ghana": [-1.0232, 7.9465],
  "Egypt": [30.8025, 26.8206],
  "Morocco": [-7.0926, 31.7917],
  "Tanzania": [34.8888, -6.369],
  "Uganda": [32.2903, 1.3733],
  "Ethiopia": [40.4897, 9.145],
  "China": [104.1954, 35.8617],
  "Mexico": [-102.5528, 23.6345],
  "Argentina": [-63.6167, -38.4161],
  "Colombia": [-74.2973, 4.5709],
  "Chile": [-71.543, -35.6751],
  "Peru": [-75.0152, -9.19],
  "Netherlands": [5.2913, 52.1326],
  "Belgium": [4.4699, 50.5039],
  "Sweden": [18.6435, 60.1282],
  "Norway": [8.4689, 60.472],
  "Denmark": [9.5018, 56.2639],
  "Finland": [25.7482, 61.9241],
  "Poland": [19.1451, 51.9194],
  "Spain": [-3.7492, 40.4637],
  "Italy": [12.5674, 41.8719],
  "Portugal": [-8.2245, 39.3999],
  "Ireland": [-8.2439, 53.4129],
  "Switzerland": [8.2275, 46.8182],
  "Austria": [14.5501, 47.5162],
  "New Zealand": [174.886, -40.9006],
  "Singapore": [103.8198, 1.3521],
  "Malaysia": [101.9758, 4.2105],
  "Indonesia": [113.9213, -0.7893],
  "Philippines": [121.774, 12.8797],
  "Thailand": [100.9925, 15.87],
  "Vietnam": [108.2772, 14.0583],
  "Pakistan": [69.3451, 30.3753],
  "Bangladesh": [90.3563, 23.685],
  "Sri Lanka": [80.7718, 7.8731],
  "United Arab Emirates": [53.8478, 23.4241],
  "Saudi Arabia": [45.0792, 23.8859],
  "Israel": [34.8516, 31.0461],
  "Turkey": [35.2433, 38.9637],
  "Greece": [21.8243, 39.0742],
  "Czech Republic": [15.473, 49.8175],
  "Hungary": [19.5033, 47.1625],
  "Romania": [24.9668, 45.9432],
  "Ukraine": [31.1656, 48.3794],
};

// Shortcodes for country names to save space on labels
const COUNTRY_SHORTCODES: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "UK",
  "United Arab Emirates": "UAE",
  "South Africa": "S. Africa",
  "New Zealand": "NZ",
};

interface CountryData {
  country: string;
  count: number;
}

interface WorldMapProps {
  data: CountryData[];
  totalStudents: number;
  activeTrainers: number;
}

function WorldMapComponent({ data, totalStudents, activeTrainers }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState("");
  const [ndaCount, setNdaCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwOwKAk0A4epU_wGAu_43wkSSMen4E29OWxXovadvS0W4HiMRJRfZJe4v7xI2Z-IAfo7Q/exec")
      .then((res) => res.json())
      .then((data) => setNdaCount(data.count))
      .catch(() => setNdaCount(-1));
  }, []);

  // Create lookup map from country name to count
  const dataByCountry = data.reduce((acc, item) => {
    acc[item.country] = item.count;
    return acc;
  }, {} as Record<string, number>);

  // Get max value for color scaling
  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const countriesWithData = data.filter((d) => d.count > 0).length;

  // Get countries that should have labels (count > threshold)
  const countriesWithLabels = data.filter((d) => d.count > LABEL_THRESHOLD);

  // Color scale: cyan gradient matching CyberMentor theme
  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#0e7490", "#22d3ee"]); // dark cyan to bright cyan

  const getCountryFromGeo = (geo: any): string => {
    // Try to get country name from various properties
    const id = geo.id?.toString();
    const properties = geo.properties || {};

    // First try our ID mapping
    if (id && ID_TO_COUNTRY[id]) {
      return ID_TO_COUNTRY[id];
    }

    // Then try common property names
    return properties.name || properties.NAME || properties.ADMIN || "Unknown";
  };

  const getCountryColor = (countryName: string) => {
    const value = dataByCountry[countryName];
    if (value) {
      return colorScale(value);
    }
    return "#1e293b"; // slate-800 for no data
  };

  // Get display label for a country (with shortcode if available)
  const getDisplayLabel = (country: string, count: number): string => {
    const shortName = COUNTRY_SHORTCODES[country] || country;
    return `${shortName}: ${count}`;
  };

  return (
    <div className="w-full">
      {/* Header with stats - 3 card grid */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6"
      >
        {/* Total Students Card */}
        <div className="relative p-4 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {totalStudents}
              </div>
              <div className="text-xs text-muted-foreground">Total Students</div>
            </div>
          </div>
        </div>

        {/* Countries Represented Card */}
        <div className="relative p-4 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-cyber-green/20 shadow-lg shadow-cyber-green/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-green/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-cyber-green" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {countriesWithData}
              </div>
              <div className="text-xs text-muted-foreground">Countries Represented</div>
            </div>
          </div>
        </div>

        {/* Active Trainers Card */}
        <div className="relative p-4 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-cyber-purple/20 shadow-lg shadow-cyber-purple/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-purple/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-cyber-purple" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {activeTrainers}
              </div>
              <div className="text-xs text-muted-foreground">Trainers</div>
            </div>
          </div>
        </div>

        {/* NDA Signed Card */}
        <div className="relative p-4 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {ndaCount === null ? "..." : ndaCount === -1 ? "—" : ndaCount}
              </div>
              <div className="text-xs text-muted-foreground">NDA Signed</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 30],
          }}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          {/* Render country shapes */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = getCountryFromGeo(geo);
                const responseCount = dataByCountry[countryName] || 0;
                const hasData = responseCount > 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={
                      hasData
                        ? `${countryName}: ${responseCount} Response${responseCount > 1 ? "s" : ""}`
                        : countryName
                    }
                    onMouseEnter={() => {
                      setTooltipContent(
                        hasData
                          ? `${countryName}: ${responseCount} Response${responseCount > 1 ? "s" : ""}`
                          : countryName
                      );
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    style={{
                      default: {
                        fill: getCountryColor(countryName),
                        stroke: hasData ? "#22d3ee" : "#334155",
                        strokeWidth: hasData ? 0.75 : 0.25,
                        outline: "none",
                        transition: "all 0.2s ease",
                        filter: hasData ? "drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))" : "none",
                      },
                      hover: {
                        fill: hasData ? "#22d3ee" : "#475569",
                        stroke: "#22d3ee",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: hasData ? "pointer" : "default",
                        filter: hasData ? "drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))" : "none",
                      },
                      pressed: {
                        fill: hasData ? "#06b6d4" : "#475569",
                        stroke: "#22d3ee",
                        strokeWidth: 1,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Render labels for countries with count > threshold */}
          {countriesWithLabels.map(({ country, count }) => {
            const coords = COUNTRY_CENTROIDS[country];
            if (!coords) return null;

            return (
              <Marker key={`label-${country}`} coordinates={coords}>
                <text
                  style={{
                    fill: "#00E5FF",
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAnchor: "middle",
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "#0B1120",
                    strokeWidth: "3px",
                    strokeLinecap: "round",
                    filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))",
                  }}
                  dominantBaseline="central"
                >
                  {getDisplayLabel(country, count)}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Gradient overlay at edges */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1e293b" }} />
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-20 h-4 rounded"
              style={{
                background: "linear-gradient(90deg, #0e7490 0%, #22d3ee 100%)",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">More responses</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground/70">
          Hover over countries for details
        </div>
      </motion.div>

      {/* Tooltip */}
      <Tooltip
        id="map-tooltip"
        className="!bg-slate-900 !text-white !px-3 !py-2 !rounded-lg !text-sm !font-medium !border !border-primary/30 !shadow-lg !shadow-primary/10"
        style={{
          backgroundColor: "#0f172a",
          zIndex: 1000,
        }}
      />
    </div>
  );
}

export const WorldMap = memo(WorldMapComponent);
