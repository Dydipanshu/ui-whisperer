export type CityConfig = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  targetId: string;
};

export const CITIES: CityConfig[] = [
  { id: "sf", name: "San Francisco", country: "US", lat: 37.7749, lon: -122.4194, targetId: "city-sf" },
  { id: "nyc", name: "New York", country: "US", lat: 40.7128, lon: -74.006, targetId: "city-nyc" },
  { id: "london", name: "London", country: "UK", lat: 51.5072, lon: -0.1276, targetId: "city-london" },
  { id: "tokyo", name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503, targetId: "city-tokyo" },
  { id: "delhi", name: "Delhi", country: "IN", lat: 28.6139, lon: 77.209, targetId: "city-delhi" },
];

export const QUICK_PROMPTS = [
  "Show top 5 cities with earthquakes",
  "Show only the city with highest AQI",
  "Show only the strongest earthquake event",
  "Highlight all major sections",
  "Create a mitigation runbook for today's top risks",
  "Unhighlight everything",
] as const;

export const TARGETS = {
  topRisk: "kpi-top-risk",
  quakeCount: "kpi-quakes",
  strongestQuake: "kpi-strongest-quake",
  cityBoard: "city-board",
  quakePanel: "quake-panel",
  actionPanel: "action-panel",
  citySanFrancisco: "city-sf",
  cityNewYork: "city-nyc",
  cityLondon: "city-london",
  cityTokyo: "city-tokyo",
  cityDelhi: "city-delhi",
  quakeTopEvent: "quake-top-event",
  mainHeader: "header-main",
} as const;
