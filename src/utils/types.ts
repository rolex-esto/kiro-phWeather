export interface WeatherRecord {
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  rain_probability: number;
  rainfall_mm: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rain_intensity: string;
}

export interface LocationSummary {
  location: string;
  avg_rain_prob: number;
  avg_rainfall: number;
  rainy_days: number;
  total_days: number;
}

export interface DailyForecast {
  date: string;
  rain_probability: number;
  rainfall_mm: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rain_intensity: string;
}
