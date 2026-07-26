import { useState, lazy, Suspense } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useFavorites } from '../hooks/useFavorites';
import { useGeolocation } from '../hooks/useGeolocation';
import { PhilippineMap } from './PhilippineMap';
import { RegionSearch } from './RegionSearch';
import { LocationDetect } from './LocationDetect';
import { FavoriteRegions } from './FavoriteRegions';
import { TyphoonBanner } from './TyphoonBanner';
import { BestTimeToGo } from './BestTimeToGo';
import { SmartRecommendations } from './SmartRecommendations';
import { DayCards } from './DayCards';
import { HourlyTimeline } from './HourlyTimeline';
import { TravelAdvice } from './TravelAdvice';
import { CitySelector } from './CitySelector';
import { StarButton } from './StarButton';
import { CalendarIcon, ClockIcon, TrendingUpIcon, SunIcon, AlertCircleIcon, MapPinIcon } from './Icons';
import { getRegionLabel } from '../utils/regions';
import { getCityCoords } from '../utils/cities';
import './Dashboard.css';

// Lazy load heavy chart components (Recharts is ~400KB)
const RainChart = lazy(() => import('./RainChart').then((m) => ({ default: m.RainChart })));
const CompareRegions = lazy(() => import('./CompareRegions').then((m) => ({ default: m.CompareRegions })));

const ALL_REGIONS = [
  'NCR', 'CAR', 'Ilocos', 'Cagayan Valley', 'Central Luzon',
  'CALABARZON', 'MIMAROPA', 'Bicol', 'Western Visayas',
  'Central Visayas', 'Eastern Visayas', 'Zamboanga Peninsula',
  'Northern Mindanao', 'Davao', 'SOCCSKSARGEN', 'Caraga', 'BARMM',
];

export function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState('NCR');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareRegion, setCompareRegion] = useState('Bicol');
  const { favorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const { detecting, error: geoError, detect } = useGeolocation();

  // Get city coordinates if a city is selected, otherwise use region center
  const cityCoords = selectedCity ? getCityCoords(selectedRegion, selectedCity) : null;
  const { loading, error, hourly, daily, lastUpdated, refetch } = useWeatherData(selectedRegion, cityCoords);

  function handleRegionSelect(region: string) {
    setSelectedRegion(region);
    setSelectedCity(null); // Reset city when region changes
  }

  async function handleDetectLocation() {
    const region = await detect();
    if (region) {
      setSelectedRegion(region);
      setSelectedCity(null);
    }
  }

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
        <RegionSearch selected={selectedRegion} onSelect={handleRegionSelect} />
        <LocationDetect detecting={detecting} onDetect={handleDetectLocation} error={geoError} />
      </div>

      {favorites.length > 0 && (
        <FavoriteRegions
          favorites={favorites}
          selected={selectedRegion}
          onSelect={handleRegionSelect}
          onRemove={removeFavorite}
        />
      )}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <PhilippineMap selected={selectedRegion} onSelect={handleRegionSelect} />
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
              <Suspense fallback={<p className="lazy-loading">Loading comparison...</p>}>
                <CompareRegions
                  regionA={selectedRegion}
                  regionB={compareRegion}
                  date={selectedDate}
                  onClose={() => setCompareMode(false)}
                />
              </Suspense>
            </div>
          )}

          {/* City selector */}
          <div className="section-card">
            <div className="section-header">
              <MapPinIcon size={18} color="var(--accent)" />
              <h2 className="section-title">
                {selectedCity || getRegionLabel(selectedRegion)}
              </h2>
            </div>
            <p className="section-desc">Select a specific city for more accurate forecast</p>
            <CitySelector
              region={selectedRegion}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
            />
          </div>

          {/* Travel advice */}
          <TravelAdvice hourly={todayHourly} region={selectedRegion} />

          {/* Smart recommendations */}
          <div className="section-card">
            <div className="section-header">
              <AlertCircleIcon size={18} color="var(--accent)" />
              <h2 className="section-title">Conditions & Alerts</h2>
            </div>
            <p className="section-desc">Umbrella, flood risk, riding conditions</p>
            <SmartRecommendations hourly={todayHourly} region={selectedRegion} />
          </div>

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
            <Suspense fallback={<p className="lazy-loading">Loading chart...</p>}>
              <RainChart daily={daily} />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
