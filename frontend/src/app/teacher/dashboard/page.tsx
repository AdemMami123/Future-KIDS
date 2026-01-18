'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherStats } from '@/lib/classApi';
import DashboardStats from '@/components/teacher/DashboardStats';
import QuickActions from '@/components/teacher/QuickActions';
import RecentActivity from '@/components/teacher/RecentActivity';
import UpcomingQuizzes from '@/components/teacher/UpcomingQuizzes';
import { BookOpen, Users, Gamepad2, GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    activeGames: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTeacherStats();
      setStats(data || {
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        activeGames: 0,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setError(error.response?.data?.message || 'Failed to load statistics');
      // Keep default stats on error
      setStats({
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        activeGames: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: GraduationCap,
      color: 'blue',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Quizzes Created',
      value: stats.totalQuizzes,
      icon: BookOpen,
      color: 'green',
    },
    {
      title: 'Active Games',
      value: stats.activeGames,
      icon: Gamepad2,
      color: 'orange',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Here&apos;s what&apos;s happening with your classes today
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8"
          >
            <p className="text-red-800 text-sm sm:text-base">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards */}
        <DashboardStats stats={statCards} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Recent Activity */}
          <RecentActivity />

          {/* Upcoming Quizzes */}
          <UpcomingQuizzes />
        </div>
      </div>
    </div>
  );
}
