import { memo } from 'react';

export const NightSky = memo(function NightSky() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="nightMoonGlow" cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#2d1b69" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#1a0a3e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a0a1a" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="60%" stopColor="#ffe4b5" />
          <stop offset="100%" stopColor="#daa520" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe4b5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffe4b5" stopOpacity="0" />
        </radialGradient>
        <filter id="moonGlowFilter">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#nightMoonGlow)" />

      {[...Array(80)].map((_, i) => (
        <circle
          key={`star-${i}`}
          cx={Math.random() * 1920}
          cy={Math.random() * 600}
          r={Math.random() * 2 + 0.5}
          fill="white"
          opacity={Math.random() * 0.7 + 0.3}
        />
      ))}

      <circle cx="960" cy="200" r="200" fill="url(#moonHalo)" filter="url(#moonGlowFilter)" />
      <circle cx="960" cy="200" r="80" fill="url(#moon)" opacity="0.9" filter="url(#moonGlowFilter)" />
      <circle cx="960" cy="200" r="70" fill="#fff8dc" opacity="0.3" />

      <g opacity="0.06">
        {[...Array(5)].map((_, i) => (
          <ellipse
            key={`cloud-${i}`}
            cx={400 + i * 300}
            cy={100 + i * 40}
            rx={200 + Math.random() * 100}
            ry={30 + Math.random() * 20}
            fill="#dda0dd"
          />
        ))}
      </g>

      {[...Array(3)].map((_, i) => (
        <ellipse
          key={`big-cloud-${i}`}
          cx={200 + i * 700}
          cy={350 + i * 50}
          rx={300}
          ry={40}
          fill="#1a0a3e"
          opacity={0.3}
        />
      ))}

      <g opacity="0.03">
        {[...Array(15)].map((_, i) => (
          <ellipse
            key={`nebula-${i}`}
            cx={Math.random() * 1920}
            cy={Math.random() * 500}
            rx={100 + Math.random() * 200}
            ry={50 + Math.random() * 100}
            fill={i % 2 === 0 ? '#8B0000' : '#4a0080'}
          />
        ))}
      </g>

      <g opacity="0.04">
        {[...Array(6)].map((_, i) => (
          <ellipse
            key={`smoke-${i}`}
            cx={200 + i * 300}
            cy={700 + Math.random() * 200}
            rx={150 + Math.random() * 100}
            ry={30 + Math.random() * 20}
            fill="#8B0000"
          />
        ))}
      </g>

      <rect x="0" y="800" width="1920" height="280" fill="#050510" opacity="0.5" />
      <rect x="0" y="0" width="1920" height="1080" fill="#4a0080" opacity="0.03" />
    </svg>
  );
});
