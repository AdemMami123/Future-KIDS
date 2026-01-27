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
  Sparkles,
  Target,
  Zap,
  Trophy,
  Clock,
  Star,
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show error banner if there was an error loading data
  const ErrorBanner = error ? (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6"
    >
      <p className="text-red-800 text-sm">
        ⚠️ {error} - Some data may not be available.
      </p>
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                EduQuiz
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => router.push('/dashboard/student/settings')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
          {ErrorBanner}
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Welcome back, {user?.firstName}!
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Ready to continue your learning journey?</p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Join Game Card - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <JoinGameCard />
              </motion.div>

              {/* Statistics Cards - Modern Glass Effect */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.totalQuizzes || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Quizzes Done</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.averagePercentage.toFixed(0) || 0}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Avg Score</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {(stats?.overview.improvement || 0) >= 0 ? '+' : ''}
                    {stats?.overview.improvement?.toFixed(0) || 0}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Improvement</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {stats?.overview.currentStreak || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Day Streak 🔥</div>
                </motion.div>
              </div>

              {/* Performance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
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
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-purple-600" />
                    Recent Results
                  </h2>
                  <button
                    onClick={() => router.push('/student/history')}
                    className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 text-sm"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {recentAttempts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No quizzes completed yet</p>
                      <p className="text-sm mt-1">Start your first quiz to see results here!</p>
                    </div>
                  ) : (
                    recentAttempts.map((attempt, index) => (
                      <motion.div
                        key={attempt.attemptId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/student/quizzes/${attempt.quiz?.quizId}/attempts/${attempt.attemptId}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {attempt.quiz?.title || 'Unknown Quiz'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                                {attempt.quiz?.subject}
                              </span>
                              <span className="text-gray-500">
                                {formatDate(attempt.completedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${getScoreColor(attempt.percentage || 0)}`}>
                              {attempt.percentage?.toFixed(0) || 0}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.score || 0}/{attempt.totalPoints || 0} pts
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Achievements
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <AchievementBadge
                    type="streak"
                    value={stats?.overview.currentStreak || 0}
                    label="Day Streak"
                    unlocked={(stats?.overview.currentStreak || 0) > 0}
                  />
                  <AchievementBadge
                    type="milestone"
                    value={stats?.overview.totalQuizzes || 0}
                    label="Quizzes"
                    unlocked={(stats?.overview.totalQuizzes || 0) >= 5}
                  />
                  <AchievementBadge
                    type="perfect"
                    value={
                      stats?.performanceTimeline.filter((p) => p.percentage === 100)
                        .length || 0
                    }
                    label="Perfect"
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

              {/* Available Quizzes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Target className="w-6 h-6 text-green-600" />
                    Available Quizzes
                  </h2>
                  <button
                    onClick={() => router.push('/student/quizzes')}
                    className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 text-sm"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {upcomingQuizzes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No new quizzes available</p>
                    </div>
                  ) : (
                    upcomingQuizzes.map((quiz, index) => (
                      <motion.div
                        key={quiz.quizId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        onClick={() =>
                          router.push(`/student/quizzes/${quiz.quizId}/start`)
                        }
                        className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {quiz.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                                {quiz.subject}
                              </span>
                              <span className={`px-2 py-1 rounded-lg font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                                {quiz.difficulty}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {quiz.totalQuestions} questions • {quiz.timeLimit}s per question
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Study Tips Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  💡 Study Tips
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">★</span>
                    <span>Complete at least one quiz daily to maintain your streak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">★</span>
                    <span>Review incorrect answers to learn from mistakes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">★</span>
                    <span>Join live games to compete with classmates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">★</span>
                    <span>Set a daily goal and track your progress</span>
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
