import { memo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { Globe, Users, MapPin } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name to ISO 3166-1 alpha-3 code mapping
const COUNTRY_TO_ISO: Record<string, string> = {
  "Rwanda": "RWA",
  "United States": "USA",
  "Canada": "CAN",
  "Russia": "RUS",
  "United Kingdom": "GBR",
  "India": "IND",
  "Germany": "DEU",
  "France": "FRA",
  "Australia": "AUS",
  "Brazil": "BRA",
  "Japan": "JPN",
  "South Africa": "ZAF",
  "Nigeria": "NGA",
  "Kenya": "KEN",
  "Ghana": "GHA",
  "Egypt": "EGY",
  "Morocco": "MAR",
  "Tanzania": "TZA",
  "Uganda": "UGA",
  "Ethiopia": "ETH",
  "China": "CHN",
  "Mexico": "MEX",
  "Argentina": "ARG",
  "Colombia": "COL",
  "Chile": "CHL",
  "Peru": "PER",
  "Netherlands": "NLD",
  "Belgium": "BEL",
  "Sweden": "SWE",
  "Norway": "NOR",
  "Denmark": "DNK",
  "Finland": "FIN",
  "Poland": "POL",
  "Spain": "ESP",
  "Italy": "ITA",
  "Portugal": "PRT",
  "Ireland": "IRL",
  "Switzerland": "CHE",
  "Austria": "AUT",
  "New Zealand": "NZL",
  "Singapore": "SGP",
  "Malaysia": "MYS",
  "Indonesia": "IDN",
  "Philippines": "PHL",
  "Thailand": "THA",
  "Vietnam": "VNM",
  "Pakistan": "PAK",
  "Bangladesh": "BGD",
  "Sri Lanka": "LKA",
  "United Arab Emirates": "ARE",
  "Saudi Arabia": "SAU",
  "Israel": "ISR",
  "Turkey": "TUR",
  "Greece": "GRC",
  "Czech Republic": "CZE",
  "Hungary": "HUN",
  "Romania": "ROU",
  "Ukraine": "UKR",
  "Unknown": "",
};

// ISO code to country name (reverse mapping)
const ISO_TO_COUNTRY: Record<string, string> = Object.entries(COUNTRY_TO_ISO).reduce(
  (acc, [name, iso]) => {
    if (iso) acc[iso] = name;
    return acc;
  },
  {} as Record<string, string>
);

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
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Convert country names to ISO codes and create lookup map
  const dataByIso = data.reduce((acc, item) => {
    const iso = COUNTRY_TO_ISO[item.country];
    if (iso) {
      acc[iso] = item.count;
    }
    return acc;
  }, {} as Record<string, number>);

  // Get max value for color scaling
  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const countriesWithData = data.filter((d) => d.count > 0).length;

  // Color scale: cyan gradient matching CyberMentor theme
  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#164e63", "#06b6d4"]); // dark cyan to bright cyan

  const getCountryColor = (iso: string) => {
    const value = dataByIso[iso];
    if (value) {
      return colorScale(value);
    }
    return "#1e293b"; // slate-800 for no data
  };

  const getCountryStyle = (iso: string) => {
    const isHovered = hoveredCountry === iso;
    const hasData = !!dataByIso[iso];

    return {
      default: {
        fill: getCountryColor(iso),
        stroke: hasData ? "#22d3ee" : "#334155",
        strokeWidth: hasData ? 0.75 : 0.25,
        outline: "none",
        transition: "all 0.2s ease",
        filter: hasData ? "drop-shadow(0 0 4px rgba(6, 182, 212, 0.3))" : "none",
      },
      hover: {
        fill: hasData ? "#22d3ee" : "#334155",
        stroke: "#22d3ee",
        strokeWidth: 1,
        outline: "none",
        cursor: hasData ? "pointer" : "default",
        filter: hasData ? "drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))" : "none",
      },
      pressed: {
        fill: hasData ? "#06b6d4" : "#334155",
        stroke: "#22d3ee",
        strokeWidth: 1,
        outline: "none",
      },
    };
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
        className="relative w-full aspect-[2/1] max-h-[500px] rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
            center: [0, 30],
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <ZoomableGroup center={[0, 20]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso = geo.properties.ISO_A3 || geo.id;
                  const countryName = ISO_TO_COUNTRY[iso] || geo.properties.name;
                  const responseCount = dataByIso[iso] || 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      data-tooltip-id="map-tooltip"
                      data-tooltip-content={
                        responseCount > 0
                          ? `${countryName}: ${responseCount} Response${responseCount > 1 ? "s" : ""}`
                          : countryName
                      }
                      onMouseEnter={() => {
                        setHoveredCountry(iso);
                        setTooltipContent(
                          responseCount > 0
                            ? `${countryName}: ${responseCount} Response${responseCount > 1 ? "s" : ""}`
                            : countryName
                        );
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                        setTooltipContent("");
                      }}
                      style={getCountryStyle(iso)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Gradient overlay at edges */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/50 via-transparent to-transparent" />
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
              background: "linear-gradient(90deg, #164e63 0%, #06b6d4 100%)",
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
