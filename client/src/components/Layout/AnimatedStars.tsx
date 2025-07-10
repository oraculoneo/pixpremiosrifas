import React, { useMemo } from 'react';

const FuturisticParticles: React.FC = () => {
  // Gerar múltiplas partículas com posições e delays aleatórios
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => {
      const colors = ['particle-cyan', 'particle-purple', 'particle-green'];
      return {
        id: i,
        top: Math.random() * 100, // Entre 0% e 100% da tela
        left: Math.random() * 100, // Entre 0% e 100% da tela
        delay: Math.random() * 20, // Delay entre 0 e 20 segundos
        size: Math.random() * 4 + 2, // Tamanho entre 2px e 6px
        duration: Math.random() * 10 + 15, // Duração entre 15 e 25 segundos
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle ${particle.color}`}
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s, 3s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
};

export default FuturisticParticles;