import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

const AnimatedCheckIn = ({ completed, onCheckIn, disabled = false, loading = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = () => {
    if (completed || disabled || loading || isAnimating) return;

    setIsAnimating(true);

    // Create particles
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
      delay: Math.random() * 100,
    }));
    setParticles(newParticles);

    // Trigger the check-in
    setTimeout(() => {
      onCheckIn();
    }, 300);

    // Clean up animation
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-particle"
          style={{
            '--angle': particle.angle,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}

      {/* Ring animation */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping-slow" />
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          relative w-20 h-20 rounded-full font-semibold text-lg
          transition-all duration-300 transform
          flex items-center justify-center
          ${completed
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200 scale-100'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-emerald-50 hover:to-emerald-100 hover:text-emerald-600 hover:scale-105'
          }
          ${isAnimating ? 'scale-110' : ''}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          active:scale-95
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs mt-1">Saving...</span>
          </div>
        ) : completed ? (
          <div className="flex flex-col items-center">
            <Check className={`w-8 h-8 ${isAnimating ? 'animate-bounce' : ''}`} />
            <span className="text-xs mt-1">Done!</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Sparkles className="w-6 h-6" />
            <span className="text-xs mt-1">Check in</span>
          </div>
        )}
      </button>

      {/* Success message */}
      {isAnimating && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-float-up">
          <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full shadow-lg">
            Great job! +1 day
          </span>
        </div>
      )}

      <style>{`
        @keyframes particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * 60px),
              calc(sin(var(--angle)) * 60px)
            ) scale(0);
            opacity: 0;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes float-up {
          0% {
            transform: translate(-50%, 0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
        }

        .animate-particle {
          animation: particle 0.6s ease-out forwards;
        }

        .animate-ping-slow {
          animation: ping-slow 0.6s ease-out forwards;
        }

        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AnimatedCheckIn;
