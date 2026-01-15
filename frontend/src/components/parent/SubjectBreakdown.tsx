'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Award, Target } from 'lucide-react';
import { SubjectStats } from '@/lib/parentApi';

interface SubjectBreakdownProps {
  data: SubjectStats[];
  loading?: boolean;
}

export default function SubjectBreakdown({
  data,
  loading = false,
}: SubjectBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Subject Breakdown
        </h3>
        <div className="text-center py-12 text-gray-500">
          No subject data available yet
        </div>
      </div>
    );
  }

  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-amber-500',
    'from-indigo-500 to-blue-500',
  ];

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const totalQuizzes = data.reduce((sum, subject) => sum + subject.quizCount, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Subject Breakdown</h3>
        <span className="text-sm text-gray-500">{totalQuizzes} total quizzes</span>
      </div>

      <div className="space-y-4">
        {data.map((subject, index) => (
          <motion.div
            key={subject.subject}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                    colors[index % colors.length]
                  } flex items-center justify-center`}
                >
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                  <p className="text-sm text-gray-500">
                    {subject.quizCount} quiz{subject.quizCount !== 1 ? 'zes' : ''}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                  subject.averagePercentage
                )}`}
              >
                {subject.averagePercentage.toFixed(1)}%
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${subject.averagePercentage}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                className={`h-full bg-gradient-to-r ${colors[index % colors.length]}`}
              ></motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-600">Avg Score</p>
                <p className="text-sm font-semibold text-gray-900">
                  {subject.averageScore.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Points</p>
                <p className="text-sm font-semibold text-gray-900">
                  {subject.earnedPoints}/{subject.totalPoints}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Efficiency</p>
                <p className="text-sm font-semibold text-gray-900">
                  {((subject.earnedPoints / subject.totalPoints) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3">Overall Performance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm text-gray-700">Best Subject</span>
            </div>
            <p className="text-lg font-bold text-purple-900">
              {data[0]?.subject || 'N/A'}
            </p>
            <p className="text-sm text-purple-700">
              {data[0]?.averagePercentage.toFixed(1)}% average
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Focus Area</span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {data[data.length - 1]?.subject || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              Needs improvement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
