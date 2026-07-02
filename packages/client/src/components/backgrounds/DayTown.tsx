import { memo } from 'react';

export const DayTown = memo(function DayTown() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a2e" />
          <stop offset="30%" stopColor="#2d1b4e" />
          <stop offset="60%" stopColor="#4a2c6e" />
          <stop offset="100%" stopColor="#6b3a8a" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#ff8c00" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ff8c00" stopOpacity="0.5" />
        </radialGradient>
        <filter id="sunGlow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#daySky)" />

      <circle cx="1500" cy="250" r="300" fill="url(#sun)" />
      <circle cx="1500" cy="250" r="60" fill="url(#sunCore)" filter="url(#sunGlow)" />

      <g opacity="0.6">
        {[100, 300, 500, 700, 900, 1100, 1300, 1500, 1700].map((x, i) => {
          const h = 200 + Math.random() * 200;
          const w = 60 + Math.random() * 80;
          return (
            <rect
              key={`b-${i}`}
              x={x}
              y={700 - h}
              width={w}
              height={h}
              fill={`rgba(20, 10, 40, ${0.3 + Math.random() * 0.3})`}
              rx={2}
            />
          );
        })}
      </g>

      {[150, 350, 650, 850, 1150, 1400, 1650].map((x, i) => (
        <rect
          key={`win-${i}`}
          x={x}
          y={500 + Math.random() * 80}
          width={6}
          height={5}
          fill="#ffd700"
          opacity={0.1 + Math.random() * 0.15}
        />
      ))}

      <rect x="0" y="700" width="1920" height="380" fill="#0a0a14" opacity="0.7" />

      <g opacity="0.03">
        {[0, 300, 600, 900, 1200, 1500, 1800].map((x, i) => (
          <line
            key={`ray-${i}`}
            x1={1500}
            y1={250}
            x2={x}
            y2={800}
            stroke="#ffd700"
            strokeWidth={40 + Math.random() * 60}
          />
        ))}
      </g>

      <rect x="0" y="700" width="1920" height="2" stroke="#ffd700" strokeWidth="0.5" opacity="0.15" />
    </svg>
  );
});
