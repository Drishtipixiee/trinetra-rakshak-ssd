import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RealFeedVideo({ src, className = '', style, children, label = 'Real video feed' }) {
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className={`real-feed-video ${className}`} style={style}>
      {!failed ? (
        <video
          key={`${src}-${reloadKey}`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          src={src}
          aria-label={label}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="real-feed-fallback">
          <AlertTriangle size={24} />
          <span>Footage source temporarily unavailable</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFailed(false);
              setReloadKey((value) => value + 1);
            }}
          >
            <RefreshCw size={14} />
            Retry feed
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
