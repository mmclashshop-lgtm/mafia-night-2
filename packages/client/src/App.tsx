import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useGameStore } from './store/gameStore';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Lobby = lazy(() => import('./pages/Lobby').then((m) => ({ default: m.Lobby })));
const Game = lazy(() => import('./pages/Game').then((m) => ({ default: m.Game })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const PlayerStats = lazy(() => import('./pages/PlayerStats').then((m) => ({ default: m.PlayerStats })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Tutorial = lazy(() => import('./pages/Tutorial').then((m) => ({ default: m.Tutorial })));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>}>
      {children}
    </Suspense>
  );
}

export default function App() {
  const connected = useGameStore((s) => s.connected);
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <Layout>
      <SuspenseWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/lobby"
            element={connected && roomCode ? <Lobby /> : <Navigate to="/" replace />}
          />
          <Route
            path="/game"
            element={connected && roomCode ? <Game /> : <Navigate to="/" replace />}
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/stats/:name" element={<PlayerStats />} />
          <Route path="/profile/:name" element={<Profile />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SuspenseWrapper>
    </Layout>
  );
}
