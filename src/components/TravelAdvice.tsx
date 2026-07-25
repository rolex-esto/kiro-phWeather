import { useEffect, useState } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';
import { convertBigInts } from '../utils/query-helpers';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  UmbrellaIcon,
  CloudLightningIcon,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  CloudRainIcon,
} from './Icons';
import { getRegionLabel } from '../utils/regions';
import './TravelAdvice.css';

interface DayStats {
  avg_prob: number;
  max_prob: number;
  total_rain: number;
  avg_temp: number;
  avg_humidity: number;
  avg_wind: number;
}

interface Props {
  region: string;
  date: string;
}

function getAdvice(stats: DayStats) {
  if (stats.avg_prob >= 70) {
    return {
      verdict: 'Not a good day to go out',
      Icon: CloudLightningIcon,
      color: '#c62828',
      bg: '#fef2f2',
      tips: [
        'Heavy rain expected - stay indoors if possible',
        'If you must travel, bring heavy rain gear',
        'Watch out for flooding in low areas',
        'Consider rescheduling outdoor plans',
      ],
    };
  }
  if (stats.avg_prob >= 50) {
    return {
      verdict: 'Bring your umbrella!',
      Icon: UmbrellaIcon,
      color: '#e65100',
      bg: '#fff8e1',
      tips: [
        'Rain is likely, especially in the afternoon',
        'Pack a waterproof bag for electronics',
        'Wear shoes that can handle puddles',
        'Have an indoor backup plan ready',
      ],
    };
  }
  if (stats.avg_prob >= 30) {
    return {
      verdict: 'Might rain - be prepared',
      Icon: AlertCircleIcon,
      color: '#f57c00',
      bg: '#fff3e0',
      tips: [
        'Light showers are possible',
        'Keep a small umbrella in your bag',
        'Morning hours are usually drier',
        'Outdoor plans should be okay with backup',
      ],
    };
  }
  return {
    verdict: 'Great day to go out!',
    Icon: CheckCircleIcon,
    color: '#2e7d32',
    bg: '#f1f8e9',
    tips: [
      'Low chance of rain - enjoy your day!',
      'Don\'t forget sunscreen if outdoors',
      'Stay hydrated in the heat',
      'Perfect for outdoor activities',
    ],
  };
}

export function TravelAdvice({ region, date }: Props) {
  const { query } = useDuckDB();
  const [stats, setStats] = useState<DayStats | null>(null);

  useEffect(() => {
    query<DayStats>(`
      SELECT
        ROUND(AVG(rain_probability), 0) as avg_prob,
        MAX(rain_probability) as max_prob,
        ROUND(SUM(rainfall_mm), 1) as total_rain,
        ROUND(AVG(temperature), 1) as avg_temp,
        ROUND(AVG(humidity), 0) as avg_humidity,
        ROUND(AVG(wind_speed), 1) as avg_wind
      FROM weather
      WHERE region = '${region}' AND date = '${date}'
    `).then((rows) => {
      if (rows.length > 0) setStats(convertBigInts(rows)[0]);
    });
  }, [query, region, date]);

  if (!stats) return null;

  const advice = getAdvice(stats);
  const AdviceIcon = advice.Icon;

  return (
    <div className="travel-advice" style={{ background: advice.bg, borderLeftColor: advice.color }}>
      <div className="advice-header">
        <div className="advice-icon-wrap" style={{ background: advice.color }}>
          <AdviceIcon size={24} color="white" />
        </div>
        <div>
          <h3 className="advice-verdict" style={{ color: advice.color }}>
            {advice.verdict}
          </h3>
          <span className="advice-region">{getRegionLabel(region)}</span>
        </div>
      </div>

      <div className="advice-stats">
        <div className="stat">
          <ThermometerIcon size={18} color="#e65100" />
          <span className="stat-value">{stats.avg_temp}{'\u00B0'}C</span>
          <span className="stat-label">Temp</span>
        </div>
        <div className="stat">
          <DropletIcon size={18} color="#1565c0" />
          <span className="stat-value">{stats.avg_humidity}%</span>
          <span className="stat-label">Humidity</span>
        </div>
        <div className="stat">
          <WindIcon size={18} color="#546e7a" />
          <span className="stat-value">{stats.avg_wind}</span>
          <span className="stat-label">Wind km/h</span>
        </div>
        <div className="stat">
          <CloudRainIcon size={18} color="#1976d2" />
          <span className="stat-value">{stats.total_rain}</span>
          <span className="stat-label">Rain mm</span>
        </div>
      </div>

      <ul className="advice-tips">
        {advice.tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
