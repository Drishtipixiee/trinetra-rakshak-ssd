/**
 * useADSB — OpenSky Network ADS-B Live Flight Hook
 * Trinetra Rakshak OSIRIS Module
 *
 * Uses OpenSky Network's free anonymous REST API (no key needed)
 * bbox: India airspace approximate bounds [lat_min, lon_min, lat_max, lon_max]
 *       6.0, 68.0, 37.0, 98.0
 *
 * API Rate limit: ~10 req/min anonymous (we poll every 60s to be safe)
 * Doc: https://opensky-network.org/apidoc/rest.html#all-state-vectors
 */
import { useState, useEffect, useRef } from 'react';

const INDIA_BBOX = { lat_min: 6.0, lon_min: 68.0, lat_max: 37.0, lon_max: 98.0 };
const OPENSKY_URL = `https://opensky-network.org/api/states/all?lamin=${INDIA_BBOX.lat_min}&lomin=${INDIA_BBOX.lon_min}&lamax=${INDIA_BBOX.lat_max}&lomax=${INDIA_BBOX.lon_max}`;

// Simulated fallback flights over India (when API rate-limited)
const SIMULATED_FLIGHTS = [
  { icao: 'AAA001', callsign: 'AI101', lat: 28.6, lon: 77.2, altitude: 10600, velocity: 820, heading: 245, origin_country: 'India' },
  { icao: 'AAA002', callsign: 'IX234', lat: 19.0, lon: 72.8, altitude: 9800, velocity: 780, heading: 90, origin_country: 'India' },
  { icao: 'AAA003', callsign: '6E456', lat: 12.9, lon: 77.6, altitude: 11200, velocity: 850, heading: 320, origin_country: 'India' },
  { icao: 'AAA004', callsign: 'UK789', lat: 22.5, lon: 88.3, altitude: 10100, velocity: 800, heading: 60, origin_country: 'India' },
  { icao: 'AAA005', callsign: 'SG301', lat: 26.8, lon: 80.9, altitude: 8500, velocity: 740, heading: 180, origin_country: 'India' },
  { icao: 'AAA006', callsign: 'AI502', lat: 17.4, lon: 78.4, altitude: 12100, velocity: 870, heading: 270, origin_country: 'India' },
  { icao: 'AAA007', callsign: 'EK509', lat: 23.0, lon: 72.5, altitude: 11500, velocity: 910, heading: 310, origin_country: 'United Arab Emirates' },
  { icao: 'AAA008', callsign: 'SQ421', lat: 13.2, lon: 80.2, altitude: 10800, velocity: 880, heading: 120, origin_country: 'Singapore' },
  { icao: 'AAA009', callsign: 'QR556', lat: 30.1, lon: 76.5, altitude: 9600, velocity: 820, heading: 200, origin_country: 'Qatar' },
  { icao: 'AAA010', callsign: 'BA138', lat: 25.3, lon: 82.1, altitude: 11000, velocity: 895, heading: 40, origin_country: 'United Kingdom' },
  { icao: 'AAA011', callsign: 'AI777', lat: 31.5, lon: 74.8, altitude: 2400, velocity: 380, heading: 155, origin_country: 'India' }, // near border
  { icao: 'AAA012', callsign: 'MIL-HEL', lat: 29.8, lon: 77.1, altitude: 800, velocity: 220, heading: 45, origin_country: 'India' }, // military helo
];

export function useADSB(enabled = true, pollIntervalMs = 60000) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('INIT'); // 'LIVE' | 'SIM' | 'INIT'
  const timerRef = useRef(null);

  const fetchFlights = async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(OPENSKY_URL, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.states && data.states.length > 0) {
        // OpenSky state vector fields:
        // [icao24, callsign, origin_country, time_position, last_contact,
        //  longitude, latitude, baro_altitude, on_ground, velocity,
        //  true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
        const parsed = data.states
          .filter(s => s[5] != null && s[6] != null) // must have lat/lon
          .map(s => ({
            icao: s[0],
            callsign: (s[1] || '------').trim(),
            origin_country: s[2],
            lon: s[5],
            lat: s[6],
            altitude: s[7] ? Math.round(s[7]) : 0,
            velocity: s[9] ? Math.round(s[9] * 3.6) : 0, // m/s to km/h
            heading: s[10] ? Math.round(s[10]) : 0,
            on_ground: s[8],
          }))
          .filter(f => !f.on_ground)
          .slice(0, 80); // cap at 80 for performance

        setFlights(parsed);
        setSource('LIVE');
      } else {
        throw new Error('Empty response');
      }
    } catch {
      // Fallback to simulated with small random drift
      const drifted = SIMULATED_FLIGHTS.map(f => ({
        ...f,
        lat: f.lat + (Math.random() - 0.5) * 0.3,
        lon: f.lon + (Math.random() - 0.5) * 0.3,
      }));
      setFlights(drifted);
      setSource('SIM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) { setFlights([]); return; }
    fetchFlights();
    timerRef.current = setInterval(fetchFlights, pollIntervalMs);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { flights, loading, source };
}
