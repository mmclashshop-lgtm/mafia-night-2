import { memo } from 'react';

export const Courtroom = memo(function Courtroom() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="courtBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a0a" />
          <stop offset="50%" stopColor="#2d1515" />
          <stop offset="100%" stopColor="#0f0505" />
        </linearGradient>
        <radialGradient id="spotlight" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#8B0000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d1a1a" />
          <stop offset="100%" stopColor="#1a0505" />
        </linearGradient>
        <filter id="spotlightFilter">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#courtBg)" />

      <rect x="0" y="0" width="1920" height="1080" fill="url(#spotlight)" />

      <rect x="100" y="150" width="1720" height="3" fill="#8B0000" opacity="0.3" />

      <rect x="850" y="200" width="220" height="30" fill="url(#benchGrad)" rx="4" opacity="0.6" />
      <rect x="860" y="230" width="200" height="400" fill="#1a0808" rx="2" opacity="0.4" />

      <g opacity="0.3">
        {[400, 600, 800, 1000, 1200, 1400].map((x, i) => (
          <rect
            key={`bench-${i}`}
            x={x}
            y={350}
            width={80}
            height={20}
            fill="#2d1515"
            rx={3}
            opacity={0.4}
          />
        ))}
      </g>

      <g opacity="0.25">
        {[400, 600, 800, 1000, 1200, 1400].map((x, i) => (
          <rect
            key={`bench-leg-${i}`}
            x={x + 10}
            y={370}
            width={8}
            height={300}
            fill="#1a0808"
            rx={1}
          />
        ))}
      </g>

      <g opacity="0.15">
        {[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800].map((x, i) => (
          <rect
            key={`pillar-${i}`}
            x={x}
            y={200}
            width={20 + Math.random() * 30}
            height={600}
            fill="#2d1515"
            rx={3}
            opacity={0.3}
          />
        ))}
      </g>

      <path d="M0,750 Q960,680 1920,750" fill="none" stroke="#8B0000" strokeWidth="0.5" opacity="0.15" />
      <path d="M0,780 Q960,720 1920,780" fill="none" stroke="#8B0000" strokeWidth="0.3" opacity="0.1" />

      <rect x="960" y="300" width="2" height="400" fill="#ffd700" opacity="0.06" />
      <rect x="960" y="300" width="2" height="400" fill="#ffd700" opacity="0.03" transform="translate(-20, 0)" />
      <rect x="960" y="300" width="2" height="400" fill="#ffd700" opacity="0.03" transform="translate(20, 0)" />

      <g opacity="0.08">
        {[300, 500, 700, 900, 1100, 1300, 1500, 1700].map((x, i) => (
          <rect
            key={`shadow-${i}`}
            x={x}
            y={650}
            width={40}
            height={5 + Math.random() * 10}
            fill="#8B0000"
            rx={2}
          />
        ))}
      </g>

      <rect x="850" y="150" width="220" height="50" fill="none" stroke="#8B0000" strokeWidth="1" opacity="0.15" rx={4} />
    </svg>
  );
});
