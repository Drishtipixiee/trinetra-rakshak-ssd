import { useState, useEffect } from 'react';

export default function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const ist = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = String(ist.getHours()).padStart(2, '0');
    const minutes = String(ist.getMinutes()).padStart(2, '0');
    const seconds = String(ist.getSeconds()).padStart(2, '0');

    const dayOfYear = Math.floor((ist - new Date(ist.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const dateStr = ist.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    return (
        <div className="live-clock">
            <div className="clock-time">
                <span className="clock-digit">{hours}</span>
                <span className="clock-separator">:</span>
                <span className="clock-digit">{minutes}</span>
                <span className="clock-separator">:</span>
                <span className="clock-digit">{seconds}</span>
                <span className="clock-zone">IST</span>
            </div>
            <div className="clock-date">
                {dateStr} | DAY {dayOfYear}
            </div>
        </div>
    );
}
