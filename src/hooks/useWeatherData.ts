import { useState, useEffect, useCallback } from 'react';
import { getCached, setCache } from './useWeatherCache';

// Region center coordinates for Open-Meteo API queries
const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'NCR': { lat: 14.5995, lon: 120.9842 },
  'CAR': { lat: 16.4023, lon: 120.596 },
  'Ilocos': { lat: 17.5747, lon: 120.3869 },
  'Cagayan Valley': { lat: 17.6132, lon: 121.727 },
  'Central Luzon': { lat: 15.145, lon: 120.5887 },
  'CALABARZON': { lat: 14.1, lon: 121.3 },
  'MIMAROPA': { lat: 9.7392, lon: 118.7353 },
  'Bicol': { lat: 13.1391, lon: 123.7438 },
  'Western Visayas': { lat: 10.7202, lon: 122.5621 },
  'Central Visayas': { lat: 10.3157, lon: 123.8854 },
  'Eastern Visayas': { lat: 11.25, lon: 125.0 },
  'Zamboanga Peninsula': { lat: 6.9214, lon: 122.079 },
  'Northern Mindanao': { lat: 8.4542, lon: 124.6319 },
  'Davao': { lat: 7.1907, lon: 125.4553 },
  'SOCCSKSARGEN': { lat: 6.5, lon: 124.85 },
  'Caraga': { lat: 8.9475, lon: 125.5406 },
  'BARMM': { lat: 7.2, lon: 124.23 },
};

export interface HourlyData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  weather_code: number;
}

export interface DailySummary {
  date: string;
  avg_prob: number;
  max_prob: number;
  total_rain: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
}

export interface WeatherState {
  loading: boolean;
  error: string | null;
  hourly: HourlyData[];
  daily: DailySummary[];
  lastUpdated: string | null;
}

function getIntensity(precipitation: number): string {
  if (precipitation <= 0) return 'None';
  if (precipitation <= 2.5) return 'Light';
  if (precipitation <= 7.5) return 'Moderate';
  if (precipitation <= 15) return 'Heavy';
  return 'Torrential';
}

export function useWeatherData(region: string, cityCoords?: { lat: number; lon: number } | null) {
  const [state, setState] = useState<WeatherState>({
    loading: true,
    error: null,
    hourly: [],
    daily: [],
    lastUpdated: null,
  });

  const fetchData = useCallback(async () => {
    // Use city coordinates if provided, otherwise fall back to region center
    const coords = cityCoords || REGION_COORDS[region];
    if (!coords) {
      setState((prev) => ({ ...prev, loading: false, error: 'Unknown region' }));
      return;
    }

    // Check cache first
    const cacheKey = `weather-${coords.lat}-${coords.lon}`;
    const cached = getCached<{ hourly: HourlyData[]; daily: DailySummary[] }>(cacheKey);
    if (cached) {
      setState({
        loading: false,
        error: null,
        hourly: cached.hourly,
        daily: cached.daily,
        lastUpdated: 'cached',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,weather_code&timezone=Asia/Manila&forecast_days=7`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const hourly: HourlyData[] = [];
      const dailyMap: Map<string, {
        probs: number[];
        rains: number[];
        temps: number[];
      }> = new Map();

      for (let i = 0; i < data.hourly.time.length; i++) {
        const time = data.hourly.time[i];
        const date = time.split('T')[0];
        const hour = parseInt(time.split('T')[1].split(':')[0], 10);

        const entry: HourlyData = {
          time,
          date,
          hour,
          temperature: data.hourly.temperature_2m[i],
          humidity: data.hourly.relative_humidity_2m[i],
          precipitation: data.hourly.precipitation[i],
          precipitation_probability: data.hourly.precipitation_probability[i],
          wind_speed: data.hourly.wind_speed_10m[i],
          weather_code: data.hourly.weather_code[i],
        };

        hourly.push(entry);

        // Accumulate daily stats
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { probs: [], rains: [], temps: [] });
        }
        const day = dailyMap.get(date)!;
        day.probs.push(entry.precipitation_probability);
        day.rains.push(entry.precipitation);
        day.temps.push(entry.temperature);
      }

      // Build daily summaries
      const daily: DailySummary[] = [];
      for (const [date, stats] of dailyMap.entries()) {
        daily.push({
          date,
          avg_prob: Math.round(stats.probs.reduce((a, b) => a + b, 0) / stats.probs.length),
          max_prob: Math.max(...stats.probs),
          total_rain: Math.round(stats.rains.reduce((a, b) => a + b, 0) * 10) / 10,
          avg_temp: Math.round((stats.temps.reduce((a, b) => a + b, 0) / stats.temps.length) * 10) / 10,
          min_temp: Math.round(Math.min(...stats.temps) * 10) / 10,
          max_temp: Math.round(Math.max(...stats.temps) * 10) / 10,
        });
      }

      setState({
        loading: false,
        error: null,
        hourly,
        daily,
        lastUpdated: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      });

      // Cache the result
      setCache(cacheKey, { hourly, daily });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch weather data',
      }));
    }
  }, [region, cityCoords]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData, getIntensity };
}
