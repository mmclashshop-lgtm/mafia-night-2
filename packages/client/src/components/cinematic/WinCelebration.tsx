import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Heart, Ghost } from 'lucide-react';

interface WinCelebrationProps {
  winner: string | null;
  onPlayAgain: () => void;
  onLeave: () => void;
  playAgainLoading: boolean;
}

const WINNER_CONFIG: Record<string, { emoji: string; color: string; text: string; icon: typeof Trophy }> = {
  mafia: {
    emoji: '🔪',
    color: 'from-red-800 via-red-600 to-red-900',
    text: 'المافيا تفوز!',
    icon: Swords,
  },
  town: {
    emoji: '⭐',
    color: 'from-amber-800 via-amber-500 to-amber-900',
    text: 'البلدة تفوز!',
    icon: Trophy,
  },
  neutral: {
    emoji: '🌀',
    color: 'from-purple-800 via-purple-500 to-purple-900',
    text: 'المحايدون يفوزون!',
    icon: Ghost,
  },
};

function ParticleBurst() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#ffd700', '#ff6b6b', '#ff4500', '#ff8c00', '#ff1493'][i % 5],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 2, 0],
            opacity: [1, 1, 0],
            y: [0, -100 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{ duration: 2 + Math.random() * 1, delay: Math.random() * 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export function WinCelebration({ winner, onPlayAgain, onLeave, playAgainLoading }: WinCelebrationProps) {
  const [show, setShow] = useState(false);
  const config = WINNER_CONFIG[winner ?? ''] ?? WINNER_CONFIG.town;
  const Icon = config.icon;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="card p-8 max-w-lg mx-auto text-center space-y-4 relative overflow-hidden"
        >
          <ParticleBurst />

          <div className="relative z-10">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.3 }}
              className="text-7xl mb-2"
            >
              {config.emoji}
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-3xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
            >
              {config.text}
            </motion.h2>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="flex justify-center my-4"
            >
              <Icon className={`w-12 h-12 ${winner === 'mafia' ? 'text-red-500' : winner === 'town' ? 'text-amber-500' : 'text-purple-500'}`} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex gap-3 justify-center mt-6"
            >
              <button
                onClick={onPlayAgain}
                disabled={playAgainLoading}
                className="btn-primary"
              >
                {playAgainLoading ? 'جارٍ إعادة التشغيل...' : 'العب مرة أخرى'}
              </button>
              <button onClick={onLeave} className="btn-secondary">
                مغادرة
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
