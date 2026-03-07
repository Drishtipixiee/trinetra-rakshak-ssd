import { Moon, Sun } from 'lucide-react';

export default function NightVisionToggle({ isNightMode, onToggle }) {
    return (
        <button
            className={`nav-btn night-vision-btn ${isNightMode ? 'active-night' : ''}`}
            onClick={onToggle}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
            {isNightMode ? (
                <>
                    <Sun size={14} /> DAY MODE
                </>
            ) : (
                <>
                    <Moon size={14} /> NIGHT VISION
                </>
            )}
        </button>
    );
}
