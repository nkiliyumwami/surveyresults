import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { Globe, Users } from "lucide-react";

// Use Natural Earth data which has proper country names
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

interface CountryData {
  country: string;
  count: number;
}

interface WorldMapProps {
  data: CountryData[];
  totalResponses: number;
}

function WorldMapComponent({ data, totalResponses }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState("");

  // Create lookup map from country name to count
  const dataByCountry = data.reduce((acc, item) => {
    acc[item.country] = item.count;
    return acc;
  }, {} as Record<string, number>);

  // Get max value for color scaling
  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const countriesWithData = data.filter((d) => d.count > 0).length;

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

  return (
    <div className="w-full">
      {/* Header with stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {totalResponses}
            </div>
            <div className="text-xs text-muted-foreground">Total Responses</div>
          </div>
        </div>

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
        </ComposableMap>

        {/* Gradient overlay at edges */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-4 mt-4"
      >
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
