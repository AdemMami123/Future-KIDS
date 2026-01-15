'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Star, Award, Zap } from 'lucide-react';

interface AchievementBadgeProps {
  type: 'streak' | 'perfect' | 'milestone' | 'subject-master' | 'speed' | 'consistent';
  value: number;
  label: string;
  unlocked?: boolean;
}

export default function AchievementBadge({
  type,
  value,
  label,
  unlocked = true,
}: AchievementBadgeProps) {
  const badgeConfig = {
    streak: {
      icon: Flame,
      gradient: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    perfect: {
      icon: Trophy,
      gradient: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    milestone: {
      icon: Target,
      gradient: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    'subject-master': {
      icon: Star,
      gradient: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    speed: {
      icon: Zap,
      gradient: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    consistent: {
      icon: Award,
      gradient: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
  };

  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative ${
        unlocked ? config.bgColor : 'bg-gray-100'
      } rounded-2xl p-6 text-center shadow-md border-2 ${
        unlocked ? 'border-transparent' : 'border-gray-200'
      }`}
    >
      {/* Badge Icon */}
      <div className="relative mx-auto w-20 h-20 mb-3">
        <motion.div
          animate={
            unlocked
              ? {
                  rotate: [0, -5, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className={`w-full h-full rounded-full flex items-center justify-center ${
            unlocked
              ? `bg-gradient-to-br ${config.gradient}`
              : 'bg-gray-300'
          } shadow-lg`}
        >
          <Icon
            className={`w-10 h-10 ${unlocked ? 'text-white' : 'text-gray-400'}`}
          />
        </motion.div>

        {/* Glow Effect for Unlocked */}
        {unlocked && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} blur-lg -z-10`}
          />
        )}

        {/* Lock Overlay for Locked */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 rounded-full backdrop-blur-sm">
            <span className="text-3xl">🔒</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className={`text-3xl font-bold mb-1 ${
          unlocked ? config.textColor : 'text-gray-400'
        }`}
      >
        {value}
      </div>

      {/* Label */}
      <div
        className={`text-sm font-medium ${
          unlocked ? config.textColor : 'text-gray-400'
        }`}
      >
        {label}
      </div>

      {/* Sparkles for Unlocked */}
      {unlocked && (
        <>
          <motion.div
            animate={{
              y: [-5, -15, -5],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0,
            }}
            className="absolute top-2 left-2 text-yellow-400"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{
              y: [-5, -15, -5],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
            className="absolute top-2 right-2 text-yellow-400"
          >
            ✨
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
