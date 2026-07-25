import { useEffect, useState } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';
import { convertBigInts } from '../utils/query-helpers';
import { CheckCircleIcon, CloudRainIcon, SunIcon } from './Icons';
import './BestTimeToGo.css';

interface HourSlot {
  hour: number;
  rain_probability: number;
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

function formatWindow(start: number, end: number): string {
  return `${getHourLabel(start)} - ${getHourLabel(end)}`;
}

export function BestTimeToGo({ region, date }: Props) {
  const { query } = useDuckDB();
  const [bestWindow, setBestWindow] = useState<{ start: number; end: number; avgProb: number } | null>(null);
  const [worstWindow, setWorstWindow] = useState<{ start: number; end: number; avgProb: number } | null>(null);

  useEffect(() => {
    query<HourSlot>(`
      SELECT
        hour,
        ROUND(AVG(rain_probability), 0) as rain_probability
      FROM weather
      WHERE region = '${region}' AND date = '${date}'
      GROUP BY hour
      ORDER BY hour
    `).then((rows) => {
      const hours = convertBigInts(rows);
      if (hours.length < 3) return;

      // Find best 3-hour window (lowest average rain probability)
      let bestStart = 0;
      let bestAvg = 100;
      let worstStart = 0;
      let worstAvg = 0;

      for (let i = 0; i <= hours.length - 3; i++) {
        const windowAvg = (hours[i].rain_probability + hours[i + 1].rain_probability + hours[i + 2].rain_probability) / 3;
        if (windowAvg < bestAvg) {
          bestAvg = windowAvg;
          bestStart = hours[i].hour;
        }
        if (windowAvg > worstAvg) {
          worstAvg = windowAvg;
          worstStart = hours[i].hour;
        }
      }

      setBestWindow({ start: bestStart, end: bestStart + 3, avgProb: Math.round(bestAvg) });
      setWorstWindow({ start: worstStart, end: worstStart + 3, avgProb: Math.round(worstAvg) });
    });
  }, [query, region, date]);

  if (!bestWindow || !worstWindow) return null;

  return (
    <div className="best-time">
      <div className="best-time-card good">
        <div className="btc-icon">
          <SunIcon size={22} color="#2e7d32" />
        </div>
        <div className="btc-info">
          <span className="btc-label">Best time to go out</span>
          <strong className="btc-time">{formatWindow(bestWindow.start, bestWindow.end)}</strong>
          <span className="btc-prob">{bestWindow.avgProb}% rain chance</span>
        </div>
        <CheckCircleIcon size={18} color="#2e7d32" />
      </div>

      <div className="best-time-card bad">
        <div className="btc-icon">
          <CloudRainIcon size={22} color="#c62828" />
        </div>
        <div className="btc-info">
          <span className="btc-label">Avoid going out</span>
          <strong className="btc-time">{formatWindow(worstWindow.start, worstWindow.end)}</strong>
          <span className="btc-prob">{worstWindow.avgProb}% rain chance</span>
        </div>
        <CloudRainIcon size={18} color="#c62828" />
      </div>
    </div>
  );
}
