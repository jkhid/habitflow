import { useState } from 'react';
import { Heart } from 'lucide-react';

const CheerButton = ({ cheered, count, onCheer, loading = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hearts, setHearts] = useState([]);

  const handleClick = () => {
    if (loading) return;
    if (!cheered) {
      setIsAnimating(true);

      // Create floating hearts
      const newHearts = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 40 - 20,
        delay: Math.random() * 200,
      }));
      setHearts(newHearts);

      setTimeout(() => {
        setIsAnimating(false);
        setHearts([]);
      }, 1000);
    }

    onCheer();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full
        font-medium text-sm transition-all duration-200
        ${cheered
          ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-pink-500'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Floating hearts */}
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="absolute pointer-events-none animate-float-heart"
          style={{
            left: `calc(50% + ${heart.x}px)`,
            animationDelay: `${heart.delay}ms`,
          }}
        >
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
        </span>
      ))}

      {/* Main heart icon */}
      <span className={`relative ${isAnimating ? 'animate-heartbeat' : ''}`}>
        <Heart
          className={`w-5 h-5 transition-all duration-200 ${
            cheered
              ? 'text-pink-500 fill-pink-500 scale-110'
              : 'text-current group-hover:text-pink-500'
          }`}
        />
        {isAnimating && (
          <span className="absolute inset-0 animate-ping">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
          </span>
        )}
      </span>

      {/* Count */}
      <span className={`transition-all duration-200 ${isAnimating ? 'scale-125' : ''}`}>
        {count}
      </span>

      <style>{`
        @keyframes float-heart {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(0.5);
          }
        }

        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1);
          }
          75% {
            transform: scale(1.2);
          }
        }

        .animate-float-heart {
          animation: float-heart 0.8s ease-out forwards;
        }

        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
      `}</style>
    </button>
  );
};

export default CheerButton;
