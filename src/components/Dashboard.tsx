import { useState } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useFavorites } from '../hooks/useFavorites';
import { PhilippineMap } from './PhilippineMap';
import { RegionSearch } from './RegionSearch';
import { FavoriteRegions } from './FavoriteRegions';
import { TyphoonBanner } from './TyphoonBanner';
import { BestTimeToGo } from './BestTimeToGo';
import { DayCards } from './DayCards';
import { HourlyTimeline } from './HourlyTimeline';
import { TravelAdvice } from './TravelAdvice';
import { RainChart } from './RainChart';
import { CompareRegions } from './CompareRegions';
import { StarButton } from './StarButton';
import { CalendarIcon, ClockIcon, TrendingUpIcon, SunIcon } from './Icons';
import { getRegionLabel } from '../utils/regions';
import './Dashboard.css';

const ALL_REGIONS = [
  'NCR', 'CAR', 'Ilocos', 'Cagayan Valley', 'Central Luzon',
  'CALABARZON', 'MIMAROPA', 'Bicol', 'Western Visayas',
  'Central Visayas', 'Eastern Visayas', 'Zamboanga Peninsula',
  'Northern Mindanao', 'Davao', 'SOCCSKSARGEN', 'Caraga', 'BARMM',
];

export function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState('NCR');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareRegion, setCompareRegion] = useState('Bicol');
  const { favorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const { loading, error, hourly, daily, lastUpdated, refetch } = useWeatherData(selectedRegion);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" aria-label="Loading" />
        <p>Fetching live weather data...</p>
        <span className="loading-sub">Getting forecast from Open-Meteo</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Could not load weather data</p>
        <span className="error-detail">{error}</span>
        <button className="retry-btn" onClick={refetch}>Try Again</button>
      </div>
    );
  }

  const todayHourly = hourly.filter((h) => h.date === selectedDate);
  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dashboard">
      <TyphoonBanner />

      <div className="dashboard-search">
        <RegionSearch selected={selectedRegion} onSelect={setSelectedRegion} />
      </div>

      {favorites.length > 0 && (
        <FavoriteRegions
          favorites={favorites}
          selected={selectedRegion}
          onSelect={setSelectedRegion}
          onRemove={removeFavorite}
        />
      )}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <PhilippineMap selected={selectedRegion} onSelect={setSelectedRegion} />
        </aside>

        <section className="dashboard-content">
          {/* Actions */}
          <div className="region-actions">
            <StarButton
              isFavorite={isFavorite(selectedRegion)}
              onClick={() => toggleFavorite(selectedRegion)}
              label={isFavorite(selectedRegion) ? 'Saved' : 'Save'}
            />
            <button
              className={`compare-btn ${compareMode ? 'active' : ''}`}
              onClick={() => setCompareMode(!compareMode)}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Compare
            </button>
            {lastUpdated && (
              <span className="last-updated">Updated: {lastUpdated}</span>
            )}
          </div>

          {/* Compare mode */}
          {compareMode && (
            <div className="compare-section">
              <div className="compare-selector">
                <span className="compare-label">Compare with:</span>
                <select
                  value={compareRegion}
                  onChange={(e) => setCompareRegion(e.target.value)}
                  className="compare-select"
                >
                  {ALL_REGIONS.filter((r) => r !== selectedRegion).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <CompareRegions
                regionA={selectedRegion}
                regionB={compareRegion}
                date={selectedDate}
                onClose={() => setCompareMode(false)}
              />
            </div>
          )}

          {/* Travel advice */}
          <TravelAdvice hourly={todayHourly} region={selectedRegion} />

          {/* Best time to go */}
          <div className="section-card">
            <div className="section-header">
              <SunIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Best Time to Go</h2>
            </div>
            <p className="section-desc">Driest and rainiest 3-hour windows today</p>
            <BestTimeToGo hourly={todayHourly} />
          </div>

          {/* Day selector */}
          <div className="section-card">
            <div className="section-header">
              <CalendarIcon size={18} color="var(--accent)" />
              <h2 className="section-title">7-Day Forecast</h2>
            </div>
            <p className="section-desc">Tap a day to see hourly breakdown</p>
            <DayCards
              daily={daily}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Hourly timeline */}
          <div className="section-card">
            <div className="section-header">
              <ClockIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Hour by Hour</h2>
            </div>
            <p className="section-desc">{dateLabel} - scroll to see when rain hits</p>
            <HourlyTimeline hourly={todayHourly} />
          </div>

          {/* Weekly trend chart */}
          <div className="section-card">
            <div className="section-header">
              <TrendingUpIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Weekly Rain Trend</h2>
            </div>
            <p className="section-desc">{getRegionLabel(selectedRegion)}</p>
            <RainChart daily={daily} />
          </div>
        </section>
      </div>
    </div>
  );
}
