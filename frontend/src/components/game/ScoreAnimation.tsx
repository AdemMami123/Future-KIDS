'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ScoreAnimationProps {
  points: number;
  isCorrect: boolean;
  show: boolean;
  onComplete?: () => void;
}

export default function ScoreAnimation({
  points,
  isCorrect,
  show,
  onComplete,
}: ScoreAnimationProps) {
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    if (show && isCorrect) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
      });

      // Animate points counting up
      const duration = 1000;
      const steps = 20;
      const increment = points / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= points) {
          setDisplayPoints(points);
          clearInterval(timer);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        } else {
          setDisplayPoints(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else if (show && !isCorrect) {
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    }
  }, [show, isCorrect, points, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`
              relative p-12 rounded-3xl shadow-2xl
              ${isCorrect ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'}
            `}
          >
            {/* Result Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-6"
            >
              {isCorrect ? (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-8xl"
                  >
                    ✓
                  </motion.div>
                  <div className="text-white text-center">
                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl font-bold mb-2"
                    >
                      Correct!
                    </motion.h2>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl font-extrabold"
                    >
                      +{displayPoints}
                    </motion.div>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl mt-2 opacity-90"
                    >
                      points earned!
                    </motion.p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-8xl"
                  >
                    ✗
                  </motion.div>
                  <div className="text-white text-center">
                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl font-bold mb-2"
                    >
                      Incorrect
                    </motion.h2>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl opacity-90"
                    >
                      Better luck next time!
                    </motion.p>
                  </div>
                </>
              )}
            </motion.div>

            {/* Floating particles */}
            {isCorrect && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, (Math.random() - 0.5) * 200],
                      y: [0, -Math.random() * 150],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full"
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
