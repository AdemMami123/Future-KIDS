'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProgressChart from '@/components/student/ProgressChart';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, QuizAttempt } from '@/lib/studentApi';

function StudentHistoryContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;

      try {
        const data = await studentApi.getAttempts(user.userId, { limit: 100 });
        setAttempts(data);
        setFilteredAttempts(data);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...attempts];

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter((a) => a.quiz?.subject === subjectFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a) => {
        const completedDate = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
        return completedDate >= weekAgo;
      });
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a) => {
        const completedDate = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
        return completedDate >= monthAgo;
      });
    }

    setFilteredAttempts(filtered);
  }, [subjectFilter, dateFilter, attempts]);

  // Get unique subjects
  const subjects = Array.from(
    new Set(attempts.map((a) => a.quiz?.subject).filter(Boolean))
  );

  // Prepare data for chart
  const chartData = filteredAttempts.map((a) => ({
    date: a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt),
    score: a.score,
    percentage: a.percentage,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/student/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Quiz History
          </h1>
          <p className="text-gray-600">
            {filteredAttempts.length} quiz{filteredAttempts.length !== 1 ? 'zes' : ''} completed
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </motion.div>

        {/* Performance Chart */}
        {filteredAttempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Performance Trend
            </h2>
            <ProgressChart data={chartData} metric="percentage" />
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Quiz Timeline
          </h2>

          {filteredAttempts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No History Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Complete quizzes to see your progress over time
              </p>
              <button
                onClick={() => router.push('/student/quizzes')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Quizzes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttempts.map((attempt, index) => (
                <motion.div
                  key={attempt.attemptId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* Left Side - Quiz Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            attempt.percentage >= 80
                              ? 'bg-green-100'
                              : attempt.percentage >= 60
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                          }`}
                        >
                          {attempt.percentage >= 70 ? (
                            <CheckCircle
                              className={`w-6 h-6 ${
                                attempt.percentage >= 80
                                  ? 'text-green-600'
                                  : 'text-yellow-600'
                              }`}
                            />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {attempt.quiz?.title || 'Unknown Quiz'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {attempt.quiz?.subject}
                            </span>
                            <span className="text-sm text-gray-500">
                              {attempt.quiz?.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(attempt.completedAt?.toDate ? attempt.completedAt.toDate() : attempt.completedAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Right Side - Score */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-purple-600 mb-1">
                        {attempt.percentage.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        {attempt.score} / {attempt.totalPoints} points
                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/student/quizzes/${attempt.quizId}/attempts/${attempt.attemptId}`
                          )
                        }
                        className="flex items-center gap-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function StudentHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentHistoryContent />
    </ProtectedRoute>
  );
}
