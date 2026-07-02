import { memo } from 'react';

export const Theater = memo(function Theater() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="curtainGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a0000" />
          <stop offset="20%" stopColor="#4a0000" />
          <stop offset="40%" stopColor="#8B0000" />
          <stop offset="50%" stopColor="#B22222" />
          <stop offset="60%" stopColor="#8B0000" />
          <stop offset="80%" stopColor="#4a0000" />
          <stop offset="100%" stopColor="#1a0000" />
        </linearGradient>
        <linearGradient id="curtainFold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B0000" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#B22222" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4a0000" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="stageLight" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="curtainShadow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="#050000" />

      <rect x="0" y="0" width="1920" height="1080" fill="url(#stageLight)" />

      <rect x="0" y="0" width="300" height="1080" fill="url(#curtainGrad)" />
      <rect x="1620" y="0" width="300" height="1080" fill="url(#curtainGrad)" />

      {[...Array(10)].map((_, i) => (
        <rect
          key={`fold-l-${i}`}
          x={30 + i * 25}
          y={0}
          width={8}
          height="1080"
          fill="url(#curtainFold)"
          opacity={0.15}
        />
      ))}

      {[...Array(10)].map((_, i) => (
        <rect
          key={`fold-r-${i}`}
          x={1620 + i * 25}
          y={0}
          width={8}
          height="1080"
          fill="url(#curtainFold)"
          opacity={0.15}
        />
      ))}

      <path d="M300,0 Q500,300 300,400" fill="#8B0000" opacity="0.3" filter="url(#curtainShadow)" />
      <path d="M1620,0 Q1420,300 1620,400" fill="#8B0000" opacity="0.3" filter="url(#curtainShadow)" />

      <rect x="300" y="0" width="1320" height="60" fill="url(#curtainGrad)" />
      <rect x="300" y="0" width="1320" height="15" fill="#1a0000" opacity="0.5" />

      {[...Array(15)].map((_, i) => (
        <rect
          key={`top-fold-${i}`}
          x={300 + i * 88}
          y={0}
          width={44}
          height={60}
          fill="#4a0000"
          opacity={0.2}
        />
      ))}

      <g opacity="0.04">
        {[...Array(3)].map((_, i) => (
          <ellipse
            key={`light-${i}`}
            cx={300 + i * 660}
            cy={400}
            rx={200 + i * 50}
            ry={300}
            fill="#ffd700"
          />
        ))}
      </g>

      <rect x="0" y="0" width="1920" height="1080" fill="#8B0000" opacity="0.02" />
    </svg>
  );
});
