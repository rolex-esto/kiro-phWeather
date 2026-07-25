import { useEffect, useState } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';
import { convertBigInts } from '../utils/query-helpers';
import { CloudRainIcon, ThermometerIcon, DropletIcon, WindIcon, CheckCircleIcon, HandshakeIcon } from './Icons';
import './CompareRegions.css';

interface RegionStats {
  region: string;
  avg_prob: number;
  total_rain: number;
  avg_temp: number;
  avg_humidity: number;
  avg_wind: number;
  rainy_hours: number;
}

interface Props {
  regionA: string;
  regionB: string;
  date: string;
  onClose: () => void;
}

function getVerdict(a: RegionStats, b: RegionStats): { winner: string; reason: string } {
  if (a.avg_prob < b.avg_prob - 10) {
    return { winner: a.region, reason: `${a.avg_prob}% vs ${b.avg_prob}% rain chance - much drier` };
  }
  if (b.avg_prob < a.avg_prob - 10) {
    return { winner: b.region, reason: `${b.avg_prob}% vs ${a.avg_prob}% rain chance - much drier` };
  }
  if (Math.abs(a.avg_prob - b.avg_prob) <= 10) {
    return { winner: 'tie', reason: 'Both regions have similar rain chances' };
  }
  return { winner: a.avg_prob < b.avg_prob ? a.region : b.region, reason: 'Slightly less rain expected' };
}

export function CompareRegions({ regionA, regionB, date, onClose }: Props) {
  const { query } = useDuckDB();
  const [statsA, setStatsA] = useState<RegionStats | null>(null);
  const [statsB, setStatsB] = useState<RegionStats | null>(null);

  useEffect(() => {
    query<RegionStats>(`
      SELECT
        region,
        ROUND(AVG(rain_probability), 0) as avg_prob,
        ROUND(SUM(rainfall_mm), 1) as total_rain,
        ROUND(AVG(temperature), 1) as avg_temp,
        ROUND(AVG(humidity), 0) as avg_humidity,
        ROUND(AVG(wind_speed), 1) as avg_wind,
        COUNT(CASE WHEN rain_intensity != 'None' THEN 1 END) as rainy_hours
      FROM weather
      WHERE region IN ('${regionA}', '${regionB}') AND date = '${date}'
      GROUP BY region
    `).then((rows) => {
      const data = convertBigInts(rows);
      setStatsA(data.find((r) => r.region === regionA) || null);
      setStatsB(data.find((r) => r.region === regionB) || null);
    });
  }, [query, regionA, regionB, date]);

  if (!statsA || !statsB) {
    return (
      <div className="compare-container">
        <p className="compare-loading">Loading comparison...</p>
      </div>
    );
  }

  const verdict = getVerdict(statsA, statsB);

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

      {/* Verdict */}
      <div className="compare-verdict">
        {verdict.winner === 'tie' ? (
          <span className="verdict-text tie"><HandshakeIcon size={16} color="#6b7280" /> {verdict.reason}</span>
        ) : (
          <span className="verdict-text">
            <CheckCircleIcon size={16} color="#2e7d32" /> <strong>{verdict.winner}</strong> is better - {verdict.reason}
          </span>
        )}
      </div>

      {/* Comparison table */}
      <div className="compare-table">
        <div className="compare-row header">
          <span className="compare-metric"></span>
          <span className="compare-val region-name">{regionA}</span>
          <span className="compare-val region-name">{regionB}</span>
        </div>

        <CompareRow
          icon={<CloudRainIcon size={16} color="#1976d2" />}
          label="Rain chance"
          valA={`${statsA.avg_prob}%`}
          valB={`${statsB.avg_prob}%`}
          betterA={statsA.avg_prob < statsB.avg_prob}
          betterB={statsB.avg_prob < statsA.avg_prob}
        />
        <CompareRow
          icon={<DropletIcon size={16} color="#1565c0" />}
          label="Total rain"
          valA={`${statsA.total_rain} mm`}
          valB={`${statsB.total_rain} mm`}
          betterA={statsA.total_rain < statsB.total_rain}
          betterB={statsB.total_rain < statsA.total_rain}
        />
        <CompareRow
          icon={<ThermometerIcon size={16} color="#e65100" />}
          label="Temperature"
          valA={`${statsA.avg_temp}\u00B0C`}
          valB={`${statsB.avg_temp}\u00B0C`}
          betterA={false}
          betterB={false}
        />
        <CompareRow
          icon={<WindIcon size={16} color="#546e7a" />}
          label="Wind"
          valA={`${statsA.avg_wind} km/h`}
          valB={`${statsB.avg_wind} km/h`}
          betterA={statsA.avg_wind < statsB.avg_wind}
          betterB={statsB.avg_wind < statsA.avg_wind}
        />
        <CompareRow
          icon={<CloudRainIcon size={16} color="#7b1fa2" />}
          label="Rainy hours"
          valA={`${statsA.rainy_hours}`}
          valB={`${statsB.rainy_hours}`}
          betterA={statsA.rainy_hours < statsB.rainy_hours}
          betterB={statsB.rainy_hours < statsA.rainy_hours}
        />
      </div>
    </div>
  );
}

function CompareRow({ icon, label, valA, valB, betterA, betterB }: {
  icon: React.ReactNode; label: string; valA: string; valB: string; betterA: boolean; betterB: boolean;
}) {
  return (
    <div className="compare-row">
      <span className="compare-metric">
        {icon}
        <span>{label}</span>
      </span>
      <span className={`compare-val ${betterA ? 'better' : ''}`}>{valA}</span>
      <span className={`compare-val ${betterB ? 'better' : ''}`}>{valB}</span>
    </div>
  );
}
