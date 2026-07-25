import { type ReactNode } from 'react';
import { StormIcon, CloudRainIcon, CloudSunRainIcon, CloudSunIcon, SunIcon } from './Icons';
import type { HourlyData } from '../hooks/useWeatherData';
import './HourlyTimeline.css';

interface Props {
  hourly: HourlyData[];
}

function getHourLabel(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
}

function getRainIcon(prob: number, precip: number): ReactNode {
  if (precip > 15) return <StormIcon size={16} color="#1565c0" />;
  if (precip > 7.5) return <CloudRainIcon size={16} color="#1976d2" />;
  if (prob >= 50) return <CloudSunRainIcon size={16} color="#42a5f5" />;
  if (prob >= 25) return <CloudSunIcon size={16} color="#ff9800" />;
  return <SunIcon size={16} color="#ffc107" />;
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

export function HourlyTimeline({ hourly }: Props) {
  if (hourly.length === 0) {
    return <p className="timeline-loading">No hourly data available</p>;
  }

  const nowHour = new Date().getHours();

  return (
    <div className="hourly-timeline">
      <div className="timeline-scroll">
        {hourly.map((h) => (
          <div
            key={h.hour}
            className={`hour-slot ${h.hour === nowHour ? 'current' : ''}`}
          >
            <span className="hour-time">{getHourLabel(h.hour)}</span>
            <span className="hour-icon">{getRainIcon(h.precipitation_probability, h.precipitation)}</span>
            <div
              className="hour-prob-bar"
              style={{
                background: getProbColor(h.precipitation_probability),
                height: `${Math.max(6, h.precipitation_probability * 0.5)}px`,
              }}
            >
              <span
                className="hour-prob-text"
                style={{ color: getProbTextColor(h.precipitation_probability) }}
              >
                {h.precipitation_probability}%
              </span>
            </div>
            <span className="hour-temp">{Math.round(h.temperature)}{'\u00B0'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
