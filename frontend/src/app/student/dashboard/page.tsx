'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  LogOut,
  Settings,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import JoinGameCard from '@/components/student/JoinGameCard';
import ProgressChart from '@/components/student/ProgressChart';
import AchievementBadge from '@/components/student/AchievementBadge';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, Quiz, QuizAttempt, StudentStats } from '@/lib/studentApi';

function StudentDashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load stats, attempts, and quizzes in parallel
        const [statsData, attemptsData, quizzesData] = await Promise.all([
          studentApi.getStats(user.userId, 30),
          studentApi.getAttempts(user.userId, { limit: 5 }),
          studentApi.getQuizzes(user.userId),
        ]);

        setStats(statsData);
        setRecentAttempts(attemptsData);
        setUpcomingQuizzes(quizzesData.filter((q) => !q.isCompleted).slice(0, 3));
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
        // Set empty states so dashboard still renders
        setStats(null);
        setRecentAttempts([]);
        setUpcomingQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error banner if there was an error loading data
  const ErrorBanner = error ? (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
    >
      <p className="text-red-800 text-sm">
        ⚠️ {error} - Some data may not be available.
      </p>
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-800">EduQuiz</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => router.push('/dashboard/student/settings')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Parent Links
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
          {ErrorBanner}
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600">Ready to learn something new today?</p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Join Game & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Join Game Card */}
              <JoinGameCard />

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.totalQuizzes || 0}
                  </div>
                  <div className="text-sm text-gray-500">Quizzes Completed</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.averagePercentage.toFixed(0) || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {(stats?.overview.improvement || 0) >= 0 ? '+' : ''}
                    {stats?.overview.improvement?.toFixed(0) || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Improvement</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <span className="text-2xl">🔥</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.currentStreak || 0}
                  </div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </motion.div>
              </div>

              {/* Performance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Your Progress
                </h2>
                <ProgressChart
                  data={stats?.performanceTimeline || []}
                  metric="percentage"
                />
              </motion.div>

              {/* Recent Quiz Results */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Recent Results
                  </h2>
                  <button
                    onClick={() => router.push('/student/history')}
                    className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {recentAttempts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No quizzes completed yet. Start your first quiz!
                      </p>
                    </div>
                  ) : (
                    recentAttempts.map((attempt) => (
                      <motion.div
                        key={attempt.attemptId}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {attempt.quiz?.title || 'Unknown Quiz'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {attempt.quiz?.subject}
                            </span>
                            <span>
                              {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {attempt.percentage?.toFixed(0) || 0}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.score || 0} points
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Achievements & Upcoming */}
            <div className="space-y-8">
              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Achievements
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <AchievementBadge
                    type="streak"
                    value={stats?.overview.currentStreak || 0}
                    label="Day Streak"
                    unlocked={(stats?.overview.currentStreak || 0) > 0}
                  />
                  <AchievementBadge
                    type="milestone"
                    value={stats?.overview.totalQuizzes || 0}
                    label="Quizzes Done"
                    unlocked={(stats?.overview.totalQuizzes || 0) >= 5}
                  />
                  <AchievementBadge
                    type="perfect"
                    value={
                      stats?.performanceTimeline.filter((p) => p.percentage === 100)
                        .length || 0
                    }
                    label="Perfect Scores"
                    unlocked={
                      (stats?.performanceTimeline.filter((p) => p.percentage === 100)
                        .length || 0) > 0
                    }
                  />
                  <AchievementBadge
                    type="consistent"
                    value={stats?.recentActivity.last7Days || 0}
                    label="This Week"
                    unlocked={(stats?.recentActivity.last7Days || 0) >= 3}
                  />
                </div>
              </motion.div>

              {/* Upcoming Quizzes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Quizzes
                  </h2>
                  <button
                    onClick={() => router.push('/student/quizzes')}
                    className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {upcomingQuizzes.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-6 text-center">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No new quizzes available
                      </p>
                    </div>
                  ) : (
                    upcomingQuizzes.map((quiz) => (
                      <motion.div
                        key={quiz.quizId}
                        whileHover={{ scale: 1.02 }}
                        onClick={() =>
                          router.push(`/student/quizzes/${quiz.quizId}/start`)
                        }
                        className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                              {quiz.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                {quiz.subject}
                              </span>
                              <span className="text-gray-500">
                                {quiz.totalQuestions} questions
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <h3 className="text-xl font-bold mb-4">💡 Study Tips</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Complete at least one quiz daily to maintain your streak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Review incorrect answers to learn from mistakes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Join live games to compete with classmates</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
