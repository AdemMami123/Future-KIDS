'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Award,
  Target,
  BookOpen,
  ArrowRight,
  Users,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ChildSelector from '@/components/parent/ChildSelector';
import StatsOverview from '@/components/parent/StatsOverview';
import PerformanceTrend from '@/components/parent/PerformanceTrend';
import SubjectBreakdown from '@/components/parent/SubjectBreakdown';
import ActivityCalendar from '@/components/parent/ActivityCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { parentApi, ChildInfo, ChildStatistics, PerformanceAlert } from '@/lib/parentApi';
import { useRouter } from 'next/navigation';

function ParentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childStats, setChildStats] = useState<ChildStatistics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load children - only once
  useEffect(() => {
    if (!user) return;

    const loadChildren = async () => {
      try {
        setLoading(true);
        const childrenData = await parentApi.getChildren(user.userId);
        setChildren(childrenData);

        // Auto-select first child
        if (childrenData.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenData[0].childId);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [user, selectedChildId]);

  // Load child stats when selection changes - with debouncing
  useEffect(() => {
    if (!user || !selectedChildId) return;

    const loadChildStats = async () => {
      try {
        setStatsLoading(true);
        // Parallel loading for better performance
        const [statsData, attemptsData] = await Promise.all([
          parentApi.getChildStats(user.userId, selectedChildId, 30),
          parentApi.getChildAttempts(user.userId, selectedChildId, { limit: 10 }),
        ]);

        setChildStats(statsData.statistics);
        setAlerts(statsData.alerts);
        setRecentAttempts(attemptsData.attempts);
      } catch (error) {
        console.error('Error loading child stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    const timer = setTimeout(loadChildStats, 0);
    return () => clearTimeout(timer);
  }, [user, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.childId === selectedChildId),
    [children, selectedChildId]
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-orange-50 border-orange-200 text-orange-800';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Parent Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Monitor your child's learning progress and performance
              </p>
            </div>
            <button
              onClick={() => router.push('/parent/children')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-1 whitespace-nowrap"
            >
              <Users className="w-5 h-5" />
              Manage Children
            </button>
          </div>
        </motion.div>

        {/* Child Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fastTransition}
          className="mb-8"
        >
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
            loading={loading}
          />
        </motion.div>

        {selectedChildId && childStats ? (
          <>
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Performance Alerts
                </h2>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`border-l-4 rounded-lg p-4 flex items-start gap-3 backdrop-blur-lg ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      <div className="flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{alert.message}</p>
                        {alert.quizTitle && (
                          <p className="text-sm mt-1 opacity-75">{alert.quizTitle}</p>
                        )}
                      </div>
                      <span className="text-xs opacity-75 whitespace-nowrap">
                        {new Date(alert.date).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stats Overview - Lazy loaded */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <StatsOverview stats={childStats} loading={statsLoading} />
            </motion.div>

            {/* Charts Grid - Lazy loaded */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={fastTransition}
              className="grid lg:grid-cols-2 gap-8 mb-8"
            >
              <LazyLoad 
                fallback={<ChartSkeleton />}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <Suspense fallback={<ChartSkeleton />}>
                  <PerformanceTrend
                    data={childStats.performanceTrend}
                    loading={statsLoading}
                  />
                </Suspense>
              </LazyLoad>
              <LazyLoad 
                fallback={<ChartSkeleton />}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <Suspense fallback={<ChartSkeleton />}>
                  <SubjectBreakdown
                    data={childStats.subjectBreakdown}
                    loading={statsLoading}
                  />
                </Suspense>
              </LazyLoad>
            </motion.div>

            {/* Activity Calendar - Lazy loaded */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={fastTransition}
              className="mb-8"
            >
              <LazyLoad 
                fallback={<CalendarSkeleton />}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <Suspense fallback={<CalendarSkeleton />}>
                  <ActivityCalendar attempts={recentAttempts} loading={statsLoading} />
                </Suspense>
              </LazyLoad>
            </motion.div>

            {/* Recent Quiz Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                  Recent Quiz Results
                </h2>
                <button
                  onClick={() => router.push(`/parent/children/${selectedChildId}`)}
                  className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No quiz results yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.slice(0, 5).map((attempt, index) => (
                    <motion.div
                      key={attempt.attemptId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {attempt.quiz?.title || 'Unknown Quiz'}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                              {attempt.quiz?.subject}
                            </span>
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {attempt.completedAt
                                ? new Date(attempt.completedAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-3xl font-bold ${
                              attempt.percentage >= 80
                                ? 'text-green-600'
                                : attempt.percentage >= 70
                                ? 'text-blue-600'
                                : attempt.percentage >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {attempt.percentage?.toFixed(0) || 0}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.score || 0}/{attempt.totalPoints || 0} pts
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <button
                onClick={() => router.push(`/parent/children/${selectedChildId}`)}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Detailed View</h4>
                <p className="text-sm text-gray-600">
                  See comprehensive statistics and analysis
                </p>
              </button>
              <button
                onClick={() => router.push('/parent/reports')}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Generate Report</h4>
                <p className="text-sm text-gray-600">
                  Create custom progress reports
                </p>
              </button>
              <button
                onClick={() => router.push('/parent/children')}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Manage Children</h4>
                <p className="text-sm text-gray-600">Link and manage child accounts</p>
              </button>
            </motion.div>
          </>
        ) : (
          !loading &&
          children.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center border border-white/20"
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No Children Linked
                </h3>
                <p className="text-gray-600 mb-6">
                  Link your child's account to start monitoring their learning progress and performance.
                </p>
                <button
                  onClick={() => router.push('/parent/children')}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  Link a Child
                </button>
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}

export default function ParentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <ParentDashboardContent />
    </ProtectedRoute>
  );
}
