'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GameTimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  isPaused?: boolean;
}

export default function GameTimer({
  duration,
  onTimeUp,
  isPaused = false,
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPaused, onTimeUp]);

  const percentage = (timeLeft / duration) * 100;
  const isUrgent = percentage < 25;
  const isWarning = percentage < 50 && percentage >= 25;

  const getTimerColor = () => {
    if (isUrgent) return 'text-red-600';
    if (isWarning) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getProgressColor = () => {
    if (isUrgent) return 'bg-red-500';
    if (isWarning) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Timer Display */}
        <motion.div
          animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: isUrgent ? Infinity : 0, duration: 1 }}
          className="relative"
        >
          <div
            className={`text-6xl font-bold ${getTimerColor()} transition-colors duration-300`}
          >
            {timeLeft}
          </div>
          <div className="text-sm text-gray-500 text-center mt-1">seconds</div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            className={`h-full ${getProgressColor()} transition-colors duration-300`}
          />
        </div>

        {/* Status Message */}
        {isUrgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 font-semibold text-sm"
          >
            ⏰ Time's almost up!
          </motion.div>
        )}

        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 font-semibold text-sm"
          >
            ⏸️ Paused
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
