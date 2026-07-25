import { useEffect, useState } from 'react';
import { CloudRainIcon, ThermometerIcon, DropletIcon, WindIcon, CheckCircleIcon, HandshakeIcon } from './Icons';
import './CompareRegions.css';

interface RegionStats {
  region: string;
  avg_prob: number;
  total_rain: number;
  avg_temp: number;
  avg_wind: number;
}

interface Props {
  regionA: string;
  regionB: string;
  date: string;
  onClose: () => void;
}

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

async function fetchRegionDay(region: string, date: string): Promise<RegionStats | null> {
  const coords = REGION_COORDS[region];
  if (!coords) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=Asia/Manila&start_date=${date}&end_date=${date}`
    );
    const data = await res.json();
    const probs: number[] = data.hourly.precipitation_probability;
    const rains: number[] = data.hourly.precipitation;
    const temps: number[] = data.hourly.temperature_2m;
    const winds: number[] = data.hourly.wind_speed_10m;
    return {
      region,
      avg_prob: Math.round(probs.reduce((a, b) => a + b, 0) / probs.length),
      total_rain: Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10,
      avg_temp: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
      avg_wind: Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10,
    };
  } catch {
    return null;
  }
}

export function CompareRegions({ regionA, regionB, date, onClose }: Props) {
  const [statsA, setStatsA] = useState<RegionStats | null>(null);
  const [statsB, setStatsB] = useState<RegionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRegionDay(regionA, date), fetchRegionDay(regionB, date)]).then(([a, b]) => {
      setStatsA(a);
      setStatsB(b);
      setLoading(false);
    });
  }, [regionA, regionB, date]);

  if (loading || !statsA || !statsB) {
    return (
      <div className="compare-container">
        <p className="compare-loading">Loading comparison...</p>
      </div>
    );
  }

  const winner = statsA.avg_prob < statsB.avg_prob ? statsA.region
    : statsB.avg_prob < statsA.avg_prob ? statsB.region : 'tie';

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h3>Compare Regions</h3>
        <button className="compare-close" onClick={onClose} aria-label="Close comparison">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="compare-verdict">
        {winner === 'tie' ? (
          <span className="verdict-text tie"><HandshakeIcon size={16} color="var(--text-muted)" /> Similar conditions</span>
        ) : (
          <span className="verdict-text">
            <CheckCircleIcon size={16} color="var(--success)" /> <strong>{winner}</strong> is drier - {statsA.avg_prob < statsB.avg_prob ? statsA.avg_prob : statsB.avg_prob}% vs {statsA.avg_prob >= statsB.avg_prob ? statsA.avg_prob : statsB.avg_prob}% rain
          </span>
        )}
      </div>

      <div className="compare-table">
        <div className="compare-row header">
          <span className="compare-metric"></span>
          <span className="compare-val region-name">{regionA}</span>
          <span className="compare-val region-name">{regionB}</span>
        </div>
        <CompareRow icon={<CloudRainIcon size={16} color="#1976d2" />} label="Rain chance" valA={`${statsA.avg_prob}%`} valB={`${statsB.avg_prob}%`} betterA={statsA.avg_prob < statsB.avg_prob} betterB={statsB.avg_prob < statsA.avg_prob} />
        <CompareRow icon={<DropletIcon size={16} color="#1565c0" />} label="Total rain" valA={`${statsA.total_rain}mm`} valB={`${statsB.total_rain}mm`} betterA={statsA.total_rain < statsB.total_rain} betterB={statsB.total_rain < statsA.total_rain} />
        <CompareRow icon={<ThermometerIcon size={16} color="#e65100" />} label="Temp" valA={`${statsA.avg_temp}\u00B0C`} valB={`${statsB.avg_temp}\u00B0C`} betterA={false} betterB={false} />
        <CompareRow icon={<WindIcon size={16} color="#546e7a" />} label="Wind" valA={`${statsA.avg_wind}km/h`} valB={`${statsB.avg_wind}km/h`} betterA={statsA.avg_wind < statsB.avg_wind} betterB={statsB.avg_wind < statsA.avg_wind} />
      </div>
    </div>
  );
}

function CompareRow({ icon, label, valA, valB, betterA, betterB }: {
  icon: React.ReactNode; label: string; valA: string; valB: string; betterA: boolean; betterB: boolean;
}) {
  return (
    <div className="compare-row">
      <span className="compare-metric">{icon}<span>{label}</span></span>
      <span className={`compare-val ${betterA ? 'better' : ''}`}>{valA}</span>
      <span className={`compare-val ${betterB ? 'better' : ''}`}>{valB}</span>
    </div>
  );
}
