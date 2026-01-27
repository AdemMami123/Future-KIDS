'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export interface QuestionStat {
  questionId: string;
  questionText: string;
  questionNumber: number;
  correctCount: number;
  incorrectCount: number;
  percentageCorrect: number;
  averageTime: number;
  totalAnswers: number;
}

interface PerformanceChartProps {
  questionStats: QuestionStat[];
  type?: 'bar' | 'accuracy';
}

export default function PerformanceChart({ questionStats, type = 'bar' }: PerformanceChartProps) {
  if (type === 'accuracy') {
    return (
      <div className="space-y-4">
        {questionStats.map((stat, index) => (
          <motion.div
            key={stat.questionId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">
                Q{stat.questionNumber}
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {stat.correctCount}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="w-4 h-4" />
                  {stat.incorrectCount}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  {stat.averageTime}s
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {stat.questionText}
            </p>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentageCorrect}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                className={`h-full rounded-full ${
                  stat.percentageCorrect >= 70
                    ? 'bg-green-500'
                    : stat.percentageCorrect >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-right text-sm font-medium mt-1">
              {stat.percentageCorrect.toFixed(0)}% correct
            </p>
          </motion.div>
        ))}
      </div>
    );
  }

  // Bar chart view
  const maxCount = Math.max(...questionStats.map(s => Math.max(s.correctCount, s.incorrectCount)));

  return (
    <div className="space-y-3">
      {questionStats.map((stat, index) => (
        <motion.div
          key={stat.questionId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-3"
        >
          <span className="w-8 text-sm font-medium text-gray-600">
            Q{stat.questionNumber}
          </span>
          <div className="flex-1 flex gap-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stat.correctCount / maxCount) * 50}%` }}
              transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
              className="h-6 bg-green-500 rounded-l flex items-center justify-end px-2"
            >
              {stat.correctCount > 0 && (
                <span className="text-xs text-white font-medium">
                  {stat.correctCount}
                </span>
              )}
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stat.incorrectCount / maxCount) * 50}%` }}
              transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
              className="h-6 bg-red-400 rounded-r flex items-center px-2"
            >
              {stat.incorrectCount > 0 && (
                <span className="text-xs text-white font-medium">
                  {stat.incorrectCount}
                </span>
              )}
            </motion.div>
          </div>
          <span className="w-16 text-sm text-gray-500 text-right">
            {stat.percentageCorrect.toFixed(0)}%
          </span>
        </motion.div>
      ))}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-gray-600">Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded" />
          <span className="text-gray-600">Incorrect</span>
        </div>
      </div>
    </div>
  );
}
