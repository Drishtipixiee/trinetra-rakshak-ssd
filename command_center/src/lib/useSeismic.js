/**
 * useSeismic — USGS Earthquake Feed Hook
 * Trinetra Rakshak OSIRIS Module
 *
 * Uses USGS free GeoJSON earthquake feed (no key needed)
 * Filters for South Asia / Indian Subcontinent region
 * Doc: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */
import { useState, useEffect, useRef } from 'react';

// Last 24h, magnitude 2.5+ worldwide (we filter South Asia client-side)
const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';

// South Asia bounding box (broader for regional context)
const SOUTH_ASIA_BBOX = { lat_min: 4, lon_min: 60, lat_max: 40, lon_max: 100 };

// Simulated fallback
const SIMULATED_QUAKES = [
  { id: 'sim-1', mag: 4.7, place: '34 km NNE of Ruteng, Indonesia', lat: 8.5, lon: 120.5, depth: 10, time: Date.now() - 3600000, color: '#ef4444' },
  { id: 'sim-2', mag: 3.2, place: '12 km SW of Muzaffarabad, Pakistan', lat: 34.3, lon: 73.4, depth: 25, time: Date.now() - 7200000, color: '#f59e0b' },
  { id: 'sim-3', mag: 4.1, place: '45 km NE of Kabul, Afghanistan', lat: 34.9, lon: 69.8, depth: 70, time: Date.now() - 14400000, color: '#f59e0b' },
  { id: 'sim-4', mag: 2.8, place: '8 km E of Dehradun, India', lat: 30.3, lon: 78.1, depth: 15, time: Date.now() - 21600000, color: '#22c55e' },
  { id: 'sim-5', mag: 5.2, place: '120 km S of Kolkata, India', lat: 21.0, lon: 88.2, depth: 40, time: Date.now() - 28800000, color: '#ef4444' },
  { id: 'sim-6', mag: 3.5, place: '32 km N of Srinagar, India', lat: 34.5, lon: 74.8, depth: 8, time: Date.now() - 36000000, color: '#f59e0b' },
];

function getQuakeColor(mag) {
  if (mag >= 5.0) return '#ef4444'; // red — significant
  if (mag >= 3.5) return '#f59e0b'; // amber — moderate
  return '#22c55e';                  // green — minor
}

export function useSeismic(enabled = true, pollIntervalMs = 120000) {
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('INIT');
  const timerRef = useRef(null);

  const fetchQuakes = async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(USGS_URL, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const parsed = data.features
        .map(f => ({
          id: f.id,
          mag: f.properties.mag,
          place: f.properties.place,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          depth: f.geometry.coordinates[2],
          time: f.properties.time,
          color: getQuakeColor(f.properties.mag),
        }))
        // Include all for global view, mark South Asia ones
        .map(q => ({
          ...q,
          inSouthAsia: (
            q.lat >= SOUTH_ASIA_BBOX.lat_min && q.lat <= SOUTH_ASIA_BBOX.lat_max &&
            q.lon >= SOUTH_ASIA_BBOX.lon_min && q.lon <= SOUTH_ASIA_BBOX.lon_max
          )
        }));

      setQuakes(parsed);
      setSource('LIVE');
    } catch {
      setQuakes(SIMULATED_QUAKES);
      setSource('SIM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) { setQuakes([]); return; }
    fetchQuakes();
    timerRef.current = setInterval(fetchQuakes, pollIntervalMs);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { quakes, loading, source };
}
