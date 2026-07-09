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
          'red-light': '#C62828',
          'red-soft': '#EF5350',
          bg: '#0a0a14',
          'bg-secondary': '#0d0d1a',
          'bg-card': '#16162a',
          'bg-elevated': '#1e1e36',
        },
        town: {
          blue: '#1565C0',
          'blue-light': '#42A5F5',
          'blue-soft': '#90CAF9',
        },
        neutral: {
          purple: '#7B1FA2',
          'purple-light': '#AB47BC',
          'purple-soft': '#CE93D8',
        },
        gold: {
          primary: '#FFD700',
          light: '#FFE082',
          dark: '#FF8F00',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'night-fade': 'nightFade 0.8s ease-in-out',
        'day-rise': 'dayRise 0.8s ease-out',
        'voting-zoom': 'votingZoom 0.5s ease-out',
        'game-over': 'gameOver 1s ease-out',
        'countdown': 'countdownPulse 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        nightFade: { '0%': { opacity: '1', filter: 'brightness(1)' }, '50%': { opacity: '0.3', filter: 'brightness(0.3)' }, '100%': { opacity: '1', filter: 'brightness(0.6)' } },
        dayRise: { '0%': { opacity: '0', transform: 'translateY(30px)', filter: 'brightness(0.5)' }, '100%': { opacity: '1', transform: 'translateY(0)', filter: 'brightness(1)' } },
        votingZoom: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '50%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        gameOver: { '0%': { transform: 'scale(0.5)', opacity: '0' }, '50%': { transform: 'scale(1.1)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 20px rgba(139, 0, 0, 0.4)' }, '50%': { boxShadow: '0 0 40px rgba(139, 0, 0, 0.8)' } },
        countdownPulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
