'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Calendar as CalendarIcon,
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

  // Load children
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
  }, [user]);

  // Load child stats when selection changes
  useEffect(() => {
    if (!user || !selectedChildId) return;

    const loadChildStats = async () => {
      try {
        setStatsLoading(true);
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

    loadChildStats();
  }, [user, selectedChildId]);

  const selectedChild = children.find((c) => c.childId === selectedChildId);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
          <p className="text-gray-600">
            Monitor your child's learning progress and performance
          </p>
        </div>

        {/* Child Selector */}
        <div className="mb-6">
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
            loading={loading}
          />
        </div>

        {selectedChildId && childStats ? (
          <>
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Alerts
                  </h3>
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 flex items-start ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="mr-3">{getSeverityIcon(alert.severity)}</div>
                        <div className="flex-1">
                          <p className="font-medium">{alert.message}</p>
                          {alert.quizTitle && (
                            <p className="text-sm mt-1 opacity-75">{alert.quizTitle}</p>
                          )}
                        </div>
                        <span className="text-xs opacity-75">
                          {new Date(alert.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Overview */}
            <div className="mb-6">
              <StatsOverview stats={childStats} loading={statsLoading} />
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <PerformanceTrend
                data={childStats.performanceTrend}
                loading={statsLoading}
              />
              <SubjectBreakdown
                data={childStats.subjectBreakdown}
                loading={statsLoading}
              />
            </div>

            {/* Activity Calendar */}
            <div className="mb-6">
              <ActivityCalendar attempts={recentAttempts} loading={statsLoading} />
            </div>

            {/* Recent Quiz Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Quiz Results
                </h3>
                <button
                  onClick={() =>
                    router.push(`/parent/children/${selectedChildId}`)
                  }
                  className="text-purple-600 hover:text-purple-700 flex items-center text-sm font-medium"
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No quiz results yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.attemptId}
                      className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {attempt.quiz?.title || 'Unknown Quiz'}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
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
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
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
                            {attempt.score || 0}/{attempt.totalPoints || 0} points
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push(`/parent/children/${selectedChildId}`)}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Detailed View</h4>
                <p className="text-sm text-gray-600">
                  See comprehensive statistics and analysis
                </p>
              </button>
              <button
                onClick={() => router.push('/parent/reports')}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
              >
                <h4 className="font-semibold text-gray-900 mb-2">
                  Generate Report
                </h4>
                <p className="text-sm text-gray-600">
                  Create custom progress reports
                </p>
              </button>
              <button
                onClick={() => router.push('/parent/children')}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Manage Children</h4>
                <p className="text-sm text-gray-600">Link and manage child accounts</p>
              </button>
            </div>
          </>
        ) : (
          !loading &&
          children.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Children Linked
                </h3>
                <p className="text-gray-600 mb-6">
                  Link your child's account to start monitoring their learning
                  progress and performance.
                </p>
                <button
                  onClick={() => router.push('/parent/children')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Link a Child
                </button>
              </div>
            </div>
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
