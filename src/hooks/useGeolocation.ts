import { useState, useCallback } from 'react';

// Map coordinates to nearest Philippine region
const REGION_CENTERS: Array<{ id: string; lat: number; lon: number }> = [
  { id: 'NCR', lat: 14.5995, lon: 120.9842 },
  { id: 'CAR', lat: 16.4023, lon: 120.596 },
  { id: 'Ilocos', lat: 17.5747, lon: 120.3869 },
  { id: 'Cagayan Valley', lat: 17.6132, lon: 121.727 },
  { id: 'Central Luzon', lat: 15.145, lon: 120.5887 },
  { id: 'CALABARZON', lat: 14.1, lon: 121.3 },
  { id: 'MIMAROPA', lat: 9.7392, lon: 118.7353 },
  { id: 'Bicol', lat: 13.1391, lon: 123.7438 },
  { id: 'Western Visayas', lat: 10.7202, lon: 122.5621 },
  { id: 'Central Visayas', lat: 10.3157, lon: 123.8854 },
  { id: 'Eastern Visayas', lat: 11.25, lon: 125.0 },
  { id: 'Zamboanga Peninsula', lat: 6.9214, lon: 122.079 },
  { id: 'Northern Mindanao', lat: 8.4542, lon: 124.6319 },
  { id: 'Davao', lat: 7.1907, lon: 125.4553 },
  { id: 'SOCCSKSARGEN', lat: 6.5, lon: 124.85 },
  { id: 'Caraga', lat: 8.9475, lon: 125.5406 },
  { id: 'BARMM', lat: 7.2, lon: 124.23 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestRegion(lat: number, lon: number): string {
  let nearest = 'NCR';
  let minDist = Infinity;
  for (const region of REGION_CENTERS) {
    const dist = haversineDistance(lat, lon, region.lat, region.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = region.id;
    }
  }
  return nearest;
}

interface GeolocationState {
  detecting: boolean;
  error: string | null;
  detectedRegion: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    detecting: false,
    error: null,
    detectedRegion: null,
  });

  const detect = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState({ detecting: false, error: 'Geolocation not supported', detectedRegion: null });
        resolve(null);
        return;
      }

      setState({ detecting: true, error: null, detectedRegion: null });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const region = findNearestRegion(position.coords.latitude, position.coords.longitude);
          setState({ detecting: false, error: null, detectedRegion: region });
          resolve(region);
        },
        (err) => {
          let errorMsg = 'Could not detect location';
          if (err.code === 1) errorMsg = 'Location access denied';
          if (err.code === 2) errorMsg = 'Location unavailable';
          if (err.code === 3) errorMsg = 'Location request timed out';
          setState({ detecting: false, error: errorMsg, detectedRegion: null });
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  }, []);

  return { ...state, detect };
}
