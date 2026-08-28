/**
 * WeatherWidget.jsx — Real-time Weather Display
 *
 * Powered by Open-Meteo API via useWeatherEngine hook.
 * Data is real, not simulated. Shows live operational weather risk for Sector 7.
 */

import { Cloud, Sun, CloudRain, CloudLightning, Wind, Eye, Thermometer, Droplets, Wifi, WifiOff, Snowflake } from 'lucide-react';
import { useWeatherEngine } from '../lib/useWeatherEngine';

const CONDITION_CONFIG = {
  CLEAR:    { icon: Sun,            color: '#facc15', label: 'CLEAR' },
  OVERCAST: { icon: Cloud,          color: '#94a3b8', label: 'OVERCAST' },
  FOG:      { icon: Cloud,          color: '#cbd5e1', label: 'FOG' },
  RAIN:     { icon: CloudRain,      color: '#60a5fa', label: 'RAIN' },
  SNOW:     { icon: Snowflake,      color: '#bfdbfe', label: 'SNOW' },
  STORM:    { icon: CloudLightning, color: '#f87171', label: 'STORM' },
};

export default function WeatherWidget() {
  const { weather, loading, apiReachable } = useWeatherEngine(300000); // refresh every 5 min

  const cfg = CONDITION_CONFIG[weather.condition] || CONDITION_CONFIG.OVERCAST;
  const WeatherIcon = cfg.icon;

  // Risk colour gradient
  const riskColor = weather.weatherRisk > 60
    ? '#ef4444'
    : weather.weatherRisk > 30
      ? '#f59e0b'
      : '#22c55e';

  return (
    <div className="weather-widget">
      {/* Header */}
      <div className="weather-header">
        <WeatherIcon size={16} style={{ color: cfg.color }} />
        <span>WEATHER — SEC-7</span>
        {/* Live / Fallback indicator */}
        <span style={{
          marginLeft: 'auto', fontSize: '0.4rem', letterSpacing: 1,
          color: apiReachable ? '#22c55e' : '#475569',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          {apiReachable
            ? <><Wifi size={8} style={{ color: '#22c55e' }} /> LIVE</>
            : <><WifiOff size={8} /> LOCAL</>}
        </span>
      </div>

      {/* Condition label */}
      <div className="weather-condition" style={{ color: cfg.color }}>
        {loading ? 'FETCHING…' : cfg.label}
      </div>

      {/* Stats row */}
      <div className="weather-stats">
        <div className="weather-stat">
          <Thermometer size={12} />
          <span>{weather.temp}°C</span>
        </div>
        <div className="weather-stat">
          <Droplets size={12} />
          <span>{weather.humidity}%</span>
        </div>
        <div className="weather-stat">
          <Wind size={12} />
          <span>{weather.wind_kmh} km/h</span>
        </div>
        <div className="weather-stat">
          <Eye size={12} />
          <span>{weather.visibility_km} km</span>
        </div>
      </div>

      {/* Weather Risk bar — this is what flows into the fuzzy engine */}
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.42rem', color: 'var(--text-dim)', marginBottom: 2, fontFamily: "'Share Tech Mono'" }}>
          <span>WEATHER RISK → FUZZY ENGINE</span>
          <span style={{ color: riskColor, fontWeight: 'bold' }}>{weather.weatherRisk}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${weather.weatherRisk}%`,
            background: `linear-gradient(90deg, #22c55e, ${riskColor})`,
            transition: 'width 1s ease',
          }} />
        </div>
      </div>

      {/* Alerts */}
      {weather.condition === 'FOG' && (
        <div className="weather-alert">
          🌫 FOG — VISIBILITY {weather.visibility_km}km — STEALTH RISK HIGH
        </div>
      )}
      {weather.condition === 'STORM' && (
        <div className="weather-alert">
          ⛈ STORM — SENSOR COVERAGE DEGRADED
        </div>
      )}
      {(weather.condition === 'RAIN' || weather.condition === 'OVERCAST') && weather.weatherRisk > 30 && (
        <div className="weather-alert" style={{ borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
          ⚠ {weather.condition} — RISK ELEVATED: {weather.weatherRisk}%
        </div>
      )}

      {/* Data source + last update */}
      {weather.lastUpdated && (
        <div style={{ fontSize: '0.38rem', color: '#334155', marginTop: 4, fontFamily: "'Share Tech Mono'", textAlign: 'right' }}>
          {weather.dataSource} • {weather.lastUpdated}
        </div>
      )}
    </div>
  );
}
