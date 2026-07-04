import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        mafia: {
          red: '#8B0000',
          'red-light': '#B22222',
          'red-dark': '#4A0000',
          accent: '#FF4444',
          'accent-soft': '#FF6B6B',
          bg: '#0A0A0A',
          'bg-secondary': '#0D0D0D',
          'bg-card': '#121212',
          'bg-elevated': '#1A1A1A',
        },
        town: {
          blue: '#2563EB',
          'blue-light': '#60A5FA',
          'blue-dark': '#1E40AF',
          'blue-soft': '#93C5FD',
        },
        neutral: {
          purple: '#9333EA',
          'purple-light': '#A855F7',
          'purple-dark': '#6B21A8',
          'purple-soft': '#C4B5FD',
        },
        gold: {
          primary: '#FFD700',
          secondary: '#DAA520',
          dark: '#B8860B',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'flip': 'flip 0.6s ease-in-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'night-fade': 'nightFade 0.8s ease-in-out',
        'day-rise': 'dayRise 0.8s ease-out',
        'voting-zoom': 'votingZoom 0.5s ease-out',
        'game-over': 'gameOver 1s ease-out',
        'glow-spin': 'glowSpin 3s linear infinite',
        'mask-float': 'maskFloat 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'shimmer-loading': 'shimmerLoading 1.5s linear infinite',
        'countdown': 'countdownPulse 1s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        nightFade: {
          '0%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.3', filter: 'brightness(0.3)' },
          '100%': { opacity: '1', filter: 'brightness(0.6)' },
        },
        dayRise: {
          '0%': { opacity: '0', transform: 'translateY(30px)', filter: 'brightness(0.5)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'brightness(1)' },
        },
        votingZoom: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gameOver: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 0, 0, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 0, 0, 0.8)' },
        },
        glowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        maskFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '33%': { transform: 'translateY(-8px) scale(1.02)' },
          '66%': { transform: 'translateY(4px) scale(0.98)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shimmerLoading: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countdownPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} satisfies Config;
