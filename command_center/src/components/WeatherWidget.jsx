import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Eye, Thermometer, Droplets } from 'lucide-react';

const WEATHER_CONDITIONS = [
    { label: 'CLEAR', icon: Sun, color: '#facc15', visibility: 95 },
    { label: 'OVERCAST', icon: Cloud, color: '#94a3b8', visibility: 75 },
    { label: 'RAIN', icon: CloudRain, color: '#60a5fa', visibility: 40 },
    { label: 'STORM', icon: CloudLightning, color: '#f87171', visibility: 20 },
];

export default function WeatherWidget() {
    const [weather, setWeather] = useState({
        temp: 28,
        humidity: 62,
        windSpeed: 12,
        visibility: 85,
        conditionIdx: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setWeather(prev => {
                const newTemp = Math.max(18, Math.min(42, prev.temp + (Math.random() - 0.5) * 2));
                const newHumidity = Math.max(30, Math.min(95, prev.humidity + (Math.random() - 0.5) * 5));
                const newWind = Math.max(2, Math.min(45, prev.windSpeed + (Math.random() - 0.5) * 4));
                // Occasionally change condition
                const changeCondition = Math.random() > 0.92;
                const newIdx = changeCondition
                    ? Math.min(3, Math.max(0, prev.conditionIdx + (Math.random() > 0.5 ? 1 : -1)))
                    : prev.conditionIdx;
                return {
                    temp: newTemp,
                    humidity: newHumidity,
                    windSpeed: newWind,
                    visibility: WEATHER_CONDITIONS[newIdx].visibility + (Math.random() - 0.5) * 10,
                    conditionIdx: newIdx,
                };
            });
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    const condition = WEATHER_CONDITIONS[weather.conditionIdx];
    const WeatherIcon = condition.icon;

    return (
        <div className="weather-widget">
            <div className="weather-header">
                <WeatherIcon size={16} style={{ color: condition.color }} />
                <span>WEATHER — SEC-7</span>
            </div>
            <div className="weather-condition" style={{ color: condition.color }}>
                {condition.label}
            </div>
            <div className="weather-stats">
                <div className="weather-stat">
                    <Thermometer size={12} />
                    <span>{Math.round(weather.temp)}°C</span>
                </div>
                <div className="weather-stat">
                    <Droplets size={12} />
                    <span>{Math.round(weather.humidity)}%</span>
                </div>
                <div className="weather-stat">
                    <Wind size={12} />
                    <span>{Math.round(weather.windSpeed)} km/h</span>
                </div>
                <div className="weather-stat">
                    <Eye size={12} />
                    <span>{Math.round(weather.visibility)}%</span>
                </div>
            </div>
            {weather.visibility < 50 && (
                <div className="weather-alert">
                    ⚠ LOW VISIBILITY — THREAT RISK ELEVATED
                </div>
            )}
        </div>
    );
}
