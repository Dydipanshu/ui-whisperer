import { CITIES } from "@/app/data";
import { logger } from "@/app/utils/logger";

type WeatherCurrent = {
  temperature_2m?: number;
  apparent_temperature?: number;
  wind_speed_10m?: number;
  precipitation?: number;
  weather_code?: number;
};

type AirCurrent = {
  us_aqi?: number;
  pm2_5?: number;
};

type EarthquakeFeature = {
  id: string;
  place: string;
  mag: number;
  time: number;
  depthKm: number;
  url: string;
};

export type CitySignal = {
  id: string;
  name: string;
  country: string;
  targetId: string;
  tempC: number | null;
  feelsLikeC: number | null;
  windKph: number | null;
  precipitationMm: number | null;
  usAqi: number | null;
  pm25: number | null;
  riskScore: number;
  riskLabel: "Low" | "Moderate" | "High" | "Critical";
};

export type LiveRiskData = {
  fetchedAtIso: string;
  sourceStatus: {
    openMeteo: "ok" | "fallback";
    usgs: "ok" | "fallback";
  };
  metrics: {
    topRiskCity: string;
    topRiskScore: number;
    strongestQuakeMag: number;
    quakeCount24h: number;
  };
  cities: CitySignal[];
  earthquakes: EarthquakeFeature[];
};

const safeRound = (value: number | null | undefined, places = 1): number | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const deriveRiskScore = (input: {
  usAqi: number | null;
  windKph: number | null;
  precipitationMm: number | null;
  tempC: number | null;
}) => {
  const aqiScore = input.usAqi ? Math.min(100, input.usAqi * 0.5) : 25;
  const windScore = input.windKph ? Math.min(100, input.windKph * 1.2) : 15;
  const rainScore = input.precipitationMm ? Math.min(100, input.precipitationMm * 10) : 10;
  const tempDeviation = input.tempC !== null ? Math.abs(input.tempC - 22) : 8;
  const tempScore = Math.min(100, tempDeviation * 3);
  const risk = Math.round(aqiScore * 0.45 + windScore * 0.25 + rainScore * 0.15 + tempScore * 0.15);
  return Math.max(0, Math.min(100, risk));
};

const riskLabel = (score: number): CitySignal["riskLabel"] => {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
};

const fallbackData = (): LiveRiskData => ({
  fetchedAtIso: new Date().toISOString(),
  sourceStatus: { openMeteo: "fallback", usgs: "fallback" },
  metrics: {
    topRiskCity: "Tokyo",
    topRiskScore: 68,
    strongestQuakeMag: 5.2,
    quakeCount24h: 124,
  },
  cities: [
    { id: "sf", name: "San Francisco", country: "US", targetId: "city-sf", tempC: 16.1, feelsLikeC: 15.8, windKph: 11.2, precipitationMm: 0, usAqi: 44, pm25: 9.6, riskScore: 33, riskLabel: "Low" },
    { id: "nyc", name: "New York", country: "US", targetId: "city-nyc", tempC: 19.4, feelsLikeC: 19.1, windKph: 18.4, precipitationMm: 0.2, usAqi: 61, pm25: 13.2, riskScore: 45, riskLabel: "Moderate" },
    { id: "london", name: "London", country: "UK", targetId: "city-london", tempC: 13.4, feelsLikeC: 12.8, windKph: 22.8, precipitationMm: 0.6, usAqi: 49, pm25: 10.1, riskScore: 43, riskLabel: "Moderate" },
    { id: "tokyo", name: "Tokyo", country: "JP", targetId: "city-tokyo", tempC: 25.2, feelsLikeC: 27.1, windKph: 26.2, precipitationMm: 1.9, usAqi: 112, pm25: 31.4, riskScore: 68, riskLabel: "High" },
    { id: "delhi", name: "Delhi", country: "IN", targetId: "city-delhi", tempC: 32.3, feelsLikeC: 36.5, windKph: 9.3, precipitationMm: 0, usAqi: 178, pm25: 55.2, riskScore: 82, riskLabel: "Critical" },
  ],
  earthquakes: [
    { id: "fallback-1", place: "Near eastern Honshu, Japan", mag: 5.2, time: Date.now() - 42 * 60 * 1000, depthKm: 33, url: "https://earthquake.usgs.gov" },
    { id: "fallback-2", place: "Central Chile", mag: 4.7, time: Date.now() - 95 * 60 * 1000, depthKm: 21, url: "https://earthquake.usgs.gov" },
  ],
});

async function fetchCitySignal(city: (typeof CITIES)[number]): Promise<CitySignal> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code&timezone=auto`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5&timezone=auto`;

  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl, { next: { revalidate: 300 } }),
    fetch(airUrl, { next: { revalidate: 300 } }),
  ]);

  if (!weatherRes.ok || !airRes.ok) {
    logger.warn("live-data", "Open-Meteo request failed", { city: city.name, weatherStatus: weatherRes.status, airStatus: airRes.status });
    throw new Error(`Open-Meteo request failed for ${city.name}`);
  }

  const weatherJson = (await weatherRes.json()) as { current?: WeatherCurrent };
  const airJson = (await airRes.json()) as { current?: AirCurrent };

  const tempC = safeRound(weatherJson.current?.temperature_2m);
  const feelsLikeC = safeRound(weatherJson.current?.apparent_temperature);
  const windKph = safeRound(weatherJson.current?.wind_speed_10m);
  const precipitationMm = safeRound(weatherJson.current?.precipitation);
  const usAqi = safeRound(airJson.current?.us_aqi, 0);
  const pm25 = safeRound(airJson.current?.pm2_5);

  const score = deriveRiskScore({ usAqi, windKph, precipitationMm, tempC });

  return {
    id: city.id,
    name: city.name,
    country: city.country,
    targetId: city.targetId,
    tempC,
    feelsLikeC,
    windKph,
    precipitationMm,
    usAqi,
    pm25,
    riskScore: score,
    riskLabel: riskLabel(score),
  };
}

async function fetchEarthquakes(): Promise<EarthquakeFeature[]> {
  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
  const response = await fetch(url, { next: { revalidate: 120 } });
  if (!response.ok) {
    logger.warn("live-data", "USGS feed request failed", { status: response.status });
    throw new Error("USGS feed request failed");
  }

  const json = (await response.json()) as {
    features?: Array<{
      id: string;
      properties?: {
        mag?: number | null;
        place?: string;
        time?: number;
        url?: string;
      };
      geometry?: {
        coordinates?: number[];
      };
    }>;
  };

  return (json.features ?? [])
    .map((f) => ({
      id: f.id,
      place: f.properties?.place ?? "Unknown location",
      mag: safeRound(f.properties?.mag ?? 0, 1) ?? 0,
      time: f.properties?.time ?? 0,
      depthKm: safeRound(f.geometry?.coordinates?.[2] ?? 0, 1) ?? 0,
      url: f.properties?.url ?? "https://earthquake.usgs.gov",
    }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 10);
}

export async function getLiveRiskData(): Promise<LiveRiskData> {
  try {
    logger.debug("live-data", "Fetching live risk data");
    const [cities, earthquakes] = await Promise.all([
      Promise.all(CITIES.map(fetchCitySignal)),
      fetchEarthquakes(),
    ]);

    const topCity = [...cities].sort((a, b) => b.riskScore - a.riskScore)[0] ?? cities[0];
    const strongest = earthquakes[0]?.mag ?? 0;

    const payload = {
      fetchedAtIso: new Date().toISOString(),
      sourceStatus: { openMeteo: "ok", usgs: "ok" },
      metrics: {
        topRiskCity: topCity.name,
        topRiskScore: topCity.riskScore,
        strongestQuakeMag: strongest,
        quakeCount24h: earthquakes.length,
      },
      cities,
      earthquakes,
    };
    logger.info("live-data", "Live data fetched", { topRiskCity: payload.metrics.topRiskCity, quakeCount: payload.metrics.quakeCount24h });
    return payload;
  } catch {
    logger.warn("live-data", "Falling back to local static data");
    return fallbackData();
  }
}
