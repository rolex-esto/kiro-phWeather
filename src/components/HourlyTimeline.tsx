import { useEffect, useState, type ReactNode } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';
import { convertBigInts } from '../utils/query-helpers';
import { StormIcon, CloudRainIcon, CloudSunRainIcon, CloudSunIcon, SunIcon } from './Icons';
import './HourlyTimeline.css';

interface HourData {
  hour: number;
  rain_probability: number;
  rainfall_mm: number;
  temperature: number;
  rain_intensity: string;
}

interface Props {
  region: string;
  date: string;
}

function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getRainIcon(intensity: string): ReactNode {
  switch (intensity) {
    case 'Torrential': return <StormIcon size={18} color="#1565c0" />;
    case 'Heavy': return <CloudRainIcon size={18} color="#1976d2" />;
    case 'Moderate': return <CloudSunRainIcon size={18} color="#42a5f5" />;
    case 'Light': return <CloudSunIcon size={18} color="#ff9800" />;
    default: return <SunIcon size={18} color="#ffc107" />;
  }
}

function getProbColor(prob: number): string {
  if (prob >= 80) return '#1565c0';
  if (prob >= 60) return '#1976d2';
  if (prob >= 40) return '#42a5f5';
  if (prob >= 20) return '#90caf9';
  return '#e3f2fd';
}

function getProbTextColor(prob: number): string {
  return prob >= 50 ? 'white' : '#1f2937';
}

export function HourlyTimeline({ region, date }: Props) {
  const { query } = useDuckDB();
  const [hours, setHours] = useState<HourData[]>([]);

  useEffect(() => {
    query<HourData>(`
      SELECT
        hour,
        ROUND(AVG(rain_probability), 0) as rain_probability,
        ROUND(AVG(rainfall_mm), 1) as rainfall_mm,
        ROUND(AVG(temperature), 1) as temperature,
        (SELECT rain_intensity FROM weather w2 
         WHERE w2.region = '${region}' AND w2.date = '${date}' AND w2.hour = weather.hour
         GROUP BY rain_intensity ORDER BY COUNT(*) DESC LIMIT 1) as rain_intensity
      FROM weather
      WHERE region = '${region}' AND date = '${date}'
      GROUP BY hour
      ORDER BY hour
    `).then((rows) => setHours(convertBigInts(rows)));
  }, [query, region, date]);

  if (hours.length === 0) {
    return <p className="timeline-loading">Loading hourly forecast...</p>;
  }

  const nowHour = new Date().getHours();

  return (
    <div className="hourly-timeline">
      <div className="timeline-scroll">
        {hours.map((h) => (
          <div
            key={h.hour}
            className={`hour-slot ${h.hour === nowHour ? 'current' : ''}`}
          >
            <span className="hour-time">{getHourLabel(h.hour)}</span>
            <span className="hour-icon">{getRainIcon(h.rain_intensity)}</span>
            <div
              className="hour-prob-bar"
              style={{
                background: getProbColor(h.rain_probability),
                height: `${Math.max(8, h.rain_probability * 0.6)}px`,
              }}
            >
              <span
                className="hour-prob-text"
                style={{ color: getProbTextColor(h.rain_probability) }}
              >
                {h.rain_probability}%
              </span>
            </div>
            <span className="hour-temp">{h.temperature}{'\u00B0'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
