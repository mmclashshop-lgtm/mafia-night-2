import { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

export function HomeParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="home-particles"
      init={particlesInit}
      className="absolute inset-0 z-0"
      options={{
        fpsLimit: 60,
        particles: {
          number: { value: 30, density: { enable: true } },
          color: { value: ['#8B0000', '#C62828', '#FFD700'] },
          shape: { type: 'circle' },
          opacity: {
            value: { min: 0.1, max: 0.4 },
            animation: { enable: true, speed: 0.5, sync: false },
          },
          size: {
            value: { min: 1, max: 3 },
            animation: { enable: true, speed: 1, sync: false },
          },
          move: {
            enable: true,
            speed: 0.3,
            direction: 'none',
            random: true,
            straight: false,
            outModes: { default: 'bounce' },
            attract: { enable: true, rotateX: 600, rotateY: 600 },
          },
          links: {
            enable: true,
            distance: 150,
            color: '#8B0000',
            opacity: 0.08,
            width: 0.5,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            onClick: { enable: true, mode: 'push' },
          },
          modes: {
            repulse: { distance: 80, duration: 0.4 },
            push: { quantity: 2 },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
