// Location data with cities and their timezones
export type LocationEntry = {
  city: string;
  country: string;
  timezone: string;
};

// Common locations grouped by country
export const LOCATIONS: LocationEntry[] = [
  // Africa
  { city: "Kigali", country: "Rwanda", timezone: "Africa/Kigali" },
  { city: "Nairobi", country: "Kenya", timezone: "Africa/Nairobi" },
  { city: "Lagos", country: "Nigeria", timezone: "Africa/Lagos" },
  { city: "Accra", country: "Ghana", timezone: "Africa/Accra" },
  { city: "Cairo", country: "Egypt", timezone: "Africa/Cairo" },
  { city: "Johannesburg", country: "South Africa", timezone: "Africa/Johannesburg" },
  { city: "Cape Town", country: "South Africa", timezone: "Africa/Johannesburg" },
  { city: "Addis Ababa", country: "Ethiopia", timezone: "Africa/Addis_Ababa" },
  { city: "Dar es Salaam", country: "Tanzania", timezone: "Africa/Dar_es_Salaam" },
  { city: "Kampala", country: "Uganda", timezone: "Africa/Kampala" },
  { city: "Casablanca", country: "Morocco", timezone: "Africa/Casablanca" },
  { city: "Tunis", country: "Tunisia", timezone: "Africa/Tunis" },
  { city: "Dakar", country: "Senegal", timezone: "Africa/Dakar" },
  { city: "Abidjan", country: "Ivory Coast", timezone: "Africa/Abidjan" },
  { city: "Kinshasa", country: "DR Congo", timezone: "Africa/Kinshasa" },
  { city: "Lusaka", country: "Zambia", timezone: "Africa/Lusaka" },
  { city: "Harare", country: "Zimbabwe", timezone: "Africa/Harare" },

  // North America
  { city: "New York", country: "United States", timezone: "America/New_York" },
  { city: "Los Angeles", country: "United States", timezone: "America/Los_Angeles" },
  { city: "Chicago", country: "United States", timezone: "America/Chicago" },
  { city: "Houston", country: "United States", timezone: "America/Chicago" },
  { city: "Phoenix", country: "United States", timezone: "America/Phoenix" },
  { city: "Philadelphia", country: "United States", timezone: "America/New_York" },
  { city: "San Antonio", country: "United States", timezone: "America/Chicago" },
  { city: "San Diego", country: "United States", timezone: "America/Los_Angeles" },
  { city: "Dallas", country: "United States", timezone: "America/Chicago" },
  { city: "San Francisco", country: "United States", timezone: "America/Los_Angeles" },
  { city: "Seattle", country: "United States", timezone: "America/Los_Angeles" },
  { city: "Denver", country: "United States", timezone: "America/Denver" },
  { city: "Boston", country: "United States", timezone: "America/New_York" },
  { city: "Atlanta", country: "United States", timezone: "America/New_York" },
  { city: "Miami", country: "United States", timezone: "America/New_York" },
  { city: "Toronto", country: "Canada", timezone: "America/Toronto" },
  { city: "Vancouver", country: "Canada", timezone: "America/Vancouver" },
  { city: "Montreal", country: "Canada", timezone: "America/Montreal" },
  { city: "Calgary", country: "Canada", timezone: "America/Edmonton" },
  { city: "Mexico City", country: "Mexico", timezone: "America/Mexico_City" },

  // Europe
  { city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { city: "Paris", country: "France", timezone: "Europe/Paris" },
  { city: "Berlin", country: "Germany", timezone: "Europe/Berlin" },
  { city: "Munich", country: "Germany", timezone: "Europe/Berlin" },
  { city: "Frankfurt", country: "Germany", timezone: "Europe/Berlin" },
  { city: "Madrid", country: "Spain", timezone: "Europe/Madrid" },
  { city: "Barcelona", country: "Spain", timezone: "Europe/Madrid" },
  { city: "Rome", country: "Italy", timezone: "Europe/Rome" },
  { city: "Milan", country: "Italy", timezone: "Europe/Rome" },
  { city: "Amsterdam", country: "Netherlands", timezone: "Europe/Amsterdam" },
  { city: "Brussels", country: "Belgium", timezone: "Europe/Brussels" },
  { city: "Vienna", country: "Austria", timezone: "Europe/Vienna" },
  { city: "Zurich", country: "Switzerland", timezone: "Europe/Zurich" },
  { city: "Geneva", country: "Switzerland", timezone: "Europe/Zurich" },
  { city: "Stockholm", country: "Sweden", timezone: "Europe/Stockholm" },
  { city: "Oslo", country: "Norway", timezone: "Europe/Oslo" },
  { city: "Copenhagen", country: "Denmark", timezone: "Europe/Copenhagen" },
  { city: "Helsinki", country: "Finland", timezone: "Europe/Helsinki" },
  { city: "Dublin", country: "Ireland", timezone: "Europe/Dublin" },
  { city: "Lisbon", country: "Portugal", timezone: "Europe/Lisbon" },
  { city: "Warsaw", country: "Poland", timezone: "Europe/Warsaw" },
  { city: "Prague", country: "Czech Republic", timezone: "Europe/Prague" },
  { city: "Budapest", country: "Hungary", timezone: "Europe/Budapest" },
  { city: "Athens", country: "Greece", timezone: "Europe/Athens" },
  { city: "Istanbul", country: "Turkey", timezone: "Europe/Istanbul" },
  { city: "Moscow", country: "Russia", timezone: "Europe/Moscow" },
  { city: "Kyiv", country: "Ukraine", timezone: "Europe/Kyiv" },
  { city: "Bucharest", country: "Romania", timezone: "Europe/Bucharest" },

  // Asia
  { city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { city: "Osaka", country: "Japan", timezone: "Asia/Tokyo" },
  { city: "Seoul", country: "South Korea", timezone: "Asia/Seoul" },
  { city: "Beijing", country: "China", timezone: "Asia/Shanghai" },
  { city: "Shanghai", country: "China", timezone: "Asia/Shanghai" },
  { city: "Shenzhen", country: "China", timezone: "Asia/Shanghai" },
  { city: "Hong Kong", country: "Hong Kong", timezone: "Asia/Hong_Kong" },
  { city: "Singapore", country: "Singapore", timezone: "Asia/Singapore" },
  { city: "Mumbai", country: "India", timezone: "Asia/Kolkata" },
  { city: "Delhi", country: "India", timezone: "Asia/Kolkata" },
  { city: "Bangalore", country: "India", timezone: "Asia/Kolkata" },
  { city: "Hyderabad", country: "India", timezone: "Asia/Kolkata" },
  { city: "Chennai", country: "India", timezone: "Asia/Kolkata" },
  { city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
  { city: "Kuala Lumpur", country: "Malaysia", timezone: "Asia/Kuala_Lumpur" },
  { city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" },
  { city: "Manila", country: "Philippines", timezone: "Asia/Manila" },
  { city: "Ho Chi Minh City", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { city: "Hanoi", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { city: "Dubai", country: "UAE", timezone: "Asia/Dubai" },
  { city: "Abu Dhabi", country: "UAE", timezone: "Asia/Dubai" },
  { city: "Riyadh", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { city: "Tel Aviv", country: "Israel", timezone: "Asia/Jerusalem" },
  { city: "Taipei", country: "Taiwan", timezone: "Asia/Taipei" },
  { city: "Dhaka", country: "Bangladesh", timezone: "Asia/Dhaka" },
  { city: "Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
  { city: "Lahore", country: "Pakistan", timezone: "Asia/Karachi" },

  // Oceania
  { city: "Sydney", country: "Australia", timezone: "Australia/Sydney" },
  { city: "Melbourne", country: "Australia", timezone: "Australia/Melbourne" },
  { city: "Brisbane", country: "Australia", timezone: "Australia/Brisbane" },
  { city: "Perth", country: "Australia", timezone: "Australia/Perth" },
  { city: "Auckland", country: "New Zealand", timezone: "Pacific/Auckland" },
  { city: "Wellington", country: "New Zealand", timezone: "Pacific/Auckland" },

  // South America
  { city: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo" },
  { city: "Rio de Janeiro", country: "Brazil", timezone: "America/Sao_Paulo" },
  { city: "Buenos Aires", country: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
  { city: "Lima", country: "Peru", timezone: "America/Lima" },
  { city: "Bogotá", country: "Colombia", timezone: "America/Bogota" },
  { city: "Santiago", country: "Chile", timezone: "America/Santiago" },
  { city: "Caracas", country: "Venezuela", timezone: "America/Caracas" },
  { city: "Quito", country: "Ecuador", timezone: "America/Guayaquil" },
  { city: "Montevideo", country: "Uruguay", timezone: "America/Montevideo" },
];

// Get unique countries sorted
export function getCountries(): string[] {
  const countries = new Set(LOCATIONS.map((l) => l.country));
  return Array.from(countries).sort();
}

// Get cities for a country
export function getCitiesForCountry(country: string): LocationEntry[] {
  return LOCATIONS.filter((l) => l.country === country).sort((a, b) =>
    a.city.localeCompare(b.city)
  );
}

// Get timezone for a city/country combination
export function getTimezoneForLocation(city: string, country: string): string | null {
  const location = LOCATIONS.find(
    (l) => l.city === city && l.country === country
  );
  return location?.timezone ?? null;
}

// Search locations by query (city or country)
export function searchLocations(query: string): LocationEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return LOCATIONS.filter(
    (l) =>
      l.city.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q)
  ).slice(0, 20); // Limit results
}

// Weekly capacity options
export const WEEKLY_CAPACITY_OPTIONS = [
  { value: "5", label: "5 hours/week", description: "Light commitment" },
  { value: "10", label: "10 hours/week", description: "Part-time" },
  { value: "20", label: "20 hours/week", description: "Half-time" },
  { value: "40+", label: "40+ hours/week", description: "Full-time" },
] as const;

// Days of the week
export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Time slots (1-hour increments)
export const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
] as const;

export type DayTimeSlot = {
  day: (typeof DAYS_OF_WEEK)[number];
  startTime: string;
  endTime: string;
};

// Convert availability array to structured format
export function parseAvailability(availability: string[]): {
  weeklyCapacity: string;
  slots: DayTimeSlot[];
} {
  let weeklyCapacity = "";
  const slots: DayTimeSlot[] = [];

  for (const item of availability) {
    // Check if it's a weekly capacity entry
    const capacityMatch = item.match(/^(\d+\+?)\s*hours?\/week$/i);
    if (capacityMatch) {
      weeklyCapacity = capacityMatch[1];
      continue;
    }

    // Try to parse day/time format: "Monday 09:00-17:00" or "Mon 09:00–17:00"
    const dayTimeMatch = item.match(
      /^(Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/i
    );

    if (dayTimeMatch) {
      const dayShort = dayTimeMatch[1].toLowerCase().slice(0, 3);
      const dayMap: Record<string, (typeof DAYS_OF_WEEK)[number]> = {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
      };

      const day = dayMap[dayShort];
      if (day) {
        slots.push({
          day,
          startTime: dayTimeMatch[2],
          endTime: dayTimeMatch[3],
        });
      }
    }
  }

  return { weeklyCapacity, slots };
}

// Convert structured availability back to string array
export function formatAvailability(
  weeklyCapacity: string,
  slots: DayTimeSlot[]
): string[] {
  const result: string[] = [];

  if (weeklyCapacity) {
    result.push(`${weeklyCapacity} hours/week`);
  }

  for (const slot of slots) {
    result.push(`${slot.day} ${slot.startTime}–${slot.endTime}`);
  }

  return result;
}
