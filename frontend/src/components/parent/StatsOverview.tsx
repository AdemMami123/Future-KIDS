'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Award,
  Flame,
  GraduationCap,
} from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    quizzesThisWeek: number;
    totalQuizzes: number;
    averagePercentage: number;
    timeSpentMinutes: number;
    currentStreak: number;
    completedQuizzes: number;
  };
  loading?: boolean;
}

export default function StatsOverview({ stats, loading = false }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: BookOpen,
      label: 'Quizzes This Week',
      value: stats.quizzesThisWeek,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Target,
      label: 'Average Score',
      value: `${stats.averagePercentage.toFixed(1)}%`,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: Clock,
      label: 'Time Spent',
      value: `${Math.floor(stats.timeSpentMinutes / 60)}h ${
        stats.timeSpentMinutes % 60
      }m`,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center mb-4`}
            >
              <Icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
