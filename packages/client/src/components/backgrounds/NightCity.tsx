import { memo } from 'react';

export const NightCity = memo(function NightCity() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="15%" r="60%">
          <stop offset="0%" stopColor="#ffe4b5" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#1a1a2e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
        </radialGradient>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f0c29" />
          <stop offset="40%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        <linearGradient id="fogGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B0000" stopOpacity="0" />
          <stop offset="30%" stopColor="#8B0000" stopOpacity="0.06" />
          <stop offset="70%" stopColor="#8B0000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#skyGrad)" />

      <circle cx="1400" cy="180" r="120" fill="#ffe4b5" opacity="0.03" filter="url(#softGlow)" />
      <circle cx="1400" cy="180" r="60" fill="#fff8dc" opacity="0.05" filter="url(#softGlow)" />
      <circle cx="1400" cy="180" r="40" fill="#fff8dc" opacity="0.3" />

      {[...Array(60)].map((_, i) => (
        <circle
          key={`star-${i}`}
          cx={Math.random() * 1920}
          cy={Math.random() * 500}
          r={Math.random() * 1.5 + 0.5}
          fill="white"
          opacity={Math.random() * 0.5 + 0.2}
        />
      ))}

      <g opacity="0.7">
        {[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800].map((x, i) => (
          <rect
            key={`build-${i}`}
            x={x}
            y={400 + Math.random() * 200}
            width={80 + Math.random() * 120}
            height={600}
            fill={`rgba(10, 10, 20, ${0.3 + Math.random() * 0.3})`}
          />
        ))}
      </g>

      {[300, 600, 900, 1200, 1500].map((x, i) => (
        <rect
          key={`win-${i}`}
          x={x}
          y={450 + Math.random() * 50}
          width={4}
          height={3}
          fill="#ffd700"
          opacity={Math.random() * 0.6 + 0.2}
          filter="url(#glow)"
        />
      ))}

      {[100, 400, 800, 1100, 1600].map((x, i) => {
        const w = 50 + Math.random() * 100;
        const h = 200 + Math.random() * 100;
        return (
          <rect
            key={`build2-${i}`}
            x={x}
            y={800 - h}
            width={w}
            height={h}
            fill={`rgba(15, 15, 30, ${0.4 + Math.random() * 0.3})`}
          />
        );
      })}

      {[150, 350, 550, 750, 950, 1150, 1350, 1550, 1750].map((x, i) => (
        <rect
          key={`win2-${i}`}
          x={x}
          y={500 + Math.random() * 100}
          width={3}
          height={2}
          fill={i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff6b6b' : '#87ceeb'}
          opacity={Math.random() * 0.5 + 0.15}
          filter="url(#glow)"
        />
      ))}

      <rect x="0" y="700" width="1920" height="380" fill="#0a0a0f" opacity="0.8" />

      <rect x="0" y="0" width="1920" height="1080" fill="url(#fogGrad)" />

      <g opacity="0.04">
        {[200, 500, 800, 1100, 1400, 1700].map((x, i) => (
          <ellipse
            key={`smoke-${i}`}
            cx={x}
            cy={700 + Math.random() * 100}
            rx={100 + Math.random() * 200}
            ry={20 + Math.random() * 30}
            fill="#8B0000"
          />
        ))}
      </g>

      <rect x="0" y="700" width="1920" height="380" fill="#000" opacity="0.3" />

      <line x1="0" y1="700" x2="1920" y2="700" stroke="#8B0000" strokeWidth="0.5" opacity="0.2" />
      <line x1="0" y1="750" x2="1920" y2="750" stroke="#8B0000" strokeWidth="0.3" opacity="0.1" />
    </svg>
  );
});
