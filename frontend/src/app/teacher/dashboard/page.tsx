'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherStats, getTeacherClasses } from '@/lib/classApi';
import { getTeacherQuizzes } from '@/lib/quizApi';
import { 
  BookOpen, 
  Users, 
  Gamepad2, 
  GraduationCap, 
  TrendingUp, 
  Clock,
  Award,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  SkeletonDashboard, 
  StaggerContainer, 
  StaggerItem,
  FadeInView,
  Button,
  Card,
  useToast
} from '@/components/ui';
import { formatDate, getDifficultyColor } from '@/lib/utils';

interface RecentQuiz {
  quizId?: string;
  title: string;
  subject: string;
  totalQuestions: number;
  createdAt?: any;
  difficulty: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    activeGames: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([]);
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async (showRefreshFeedback = false) => {
    if (!user) return;
    
    try {
      if (showRefreshFeedback) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      // Load all data in parallel
      const [statsData, quizzesData, classesData] = await Promise.all([
        getTeacherStats(),
        getTeacherQuizzes(user.userId),
        getTeacherClasses(user.userId)
      ]);
      
      setStats(statsData || {
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        activeGames: 0,
      });
      
      // Get recent quizzes (last 3)
      const sortedQuizzes = (quizzesData || [])
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3);
      setRecentQuizzes(sortedQuizzes);
      
      // Get recent classes
      setRecentClasses((classesData || []).slice(0, 3));
      
      if (showRefreshFeedback) {
        showSuccess('Dashboard refreshed!');
      }
      
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      showError('Error loading data', errorMessage);
      setStats({
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        activeGames: 0,
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Memoized stats cards data
  const statsCards = useMemo(() => [
    {
      icon: GraduationCap,
      value: stats.totalClasses,
      label: t('teacher.dashboard.totalClasses'),
      gradient: 'from-blue-500 to-blue-600',
      trend: TrendingUp,
      trendColor: 'text-green-500',
    },
    {
      icon: Users,
      value: stats.totalStudents,
      label: t('teacher.dashboard.totalStudents'),
      gradient: 'from-purple-500 to-purple-600',
      trend: TrendingUp,
      trendColor: 'text-green-500',
    },
    {
      icon: BookOpen,
      value: stats.totalQuizzes,
      label: t('teacher.dashboard.quizzesCreated'),
      gradient: 'from-green-500 to-green-600',
      trend: Award,
      trendColor: 'text-yellow-500',
    },
    {
      icon: Gamepad2,
      value: stats.activeGames,
      label: t('teacher.dashboard.activeGames'),
      gradient: 'from-orange-500 to-orange-600',
      isLive: true,
    },
  ], [stats, t]);

  const handleFormatDifficultyColor = (difficulty: string) => {
    const colorClass = getDifficultyColor(difficulty);
    return colorClass === 'text-green-500' ? 'bg-green-100 text-green-700' :
           colorClass === 'text-yellow-500' ? 'bg-yellow-100 text-yellow-700' :
           colorClass === 'text-red-500' ? 'bg-red-100 text-red-700' :
           'bg-gray-100 text-gray-700';
  };

  const formatDateDisplay = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return formatDate(d, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Show skeleton loading on initial load
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-500" aria-hidden="true" />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('teacher.dashboard.welcomeBack', { name: user?.firstName || t('common.welcome') })}
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                {t('teacher.dashboard.teachingOverview')}
              </p>
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              onClick={() => loadDashboardData(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              aria-label={t('teacher.dashboard.refreshData')}
            >
              {t('teacher.dashboard.refresh')}
            </Button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8 flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-red-800 font-medium">{t('teacher.dashboard.errorLoading')}</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button
                variant="link"
                onClick={() => loadDashboardData()}
                className="mt-2 text-red-700"
              >
                {t('teacher.dashboard.tryAgain')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats Cards - Modern Glass Effect */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <StaggerItem key={stat.label}>
              <Card
                variant="glass"
                hover
                animated
                className="relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  {stat.isLive ? (
                    <div className="flex items-center gap-1" aria-label={t('teacher.dashboard.live')}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-600">{t('teacher.dashboard.live')}</span>
                    </div>
                  ) : stat.trend && (
                    <stat.trend className={`w-5 h-5 ${stat.trendColor}`} aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Quick Actions */}
        <FadeInView delay={0.2}>
          <Card variant="glass" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" aria-hidden="true" />
              {t('teacher.dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push('/teacher/quizzes/create')}
                className="!justify-start !p-4 !h-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                leftIcon={<Plus className="w-6 h-6" />}
                size="lg"
              >
                <span className="font-semibold">{t('teacher.dashboard.createQuiz')}</span>
              </Button>
              <Button
                onClick={() => router.push('/teacher/games/create')}
                className="!justify-start !p-4 !h-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                leftIcon={<Gamepad2 className="w-6 h-6" />}
                size="lg"
              >
                <span className="font-semibold">{t('teacher.dashboard.startGame')}</span>
              </Button>
              <Button
                onClick={() => router.push('/teacher/classes')}
                className="!justify-start !p-4 !h-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                leftIcon={<GraduationCap className="w-6 h-6" />}
                size="lg"
              >
                <span className="font-semibold">{t('teacher.dashboard.manageClasses')}</span>
              </Button>
            </div>
          </Card>
        </FadeInView>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Recently Created Quizzes */}
          <FadeInView direction="left" delay={0.3}>
            <Card variant="glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-600" aria-hidden="true" />
                  Recent Quizzes
                </h2>
                <Button
                  variant="link"
                  onClick={() => router.push('/teacher/quizzes')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4" role="list" aria-label="Recent quizzes">
                {recentQuizzes.length > 0 ? (
                  recentQuizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.quizId || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        if (quiz.quizId) {
                          router.push(`/teacher/quizzes/${quiz.quizId}`);
                        }
                      }}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && quiz.quizId) {
                          router.push(`/teacher/quizzes/${quiz.quizId}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1 truncate">{quiz.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
                              {quiz.subject}
                            </span>
                            <span className={`px-2 py-1 rounded-lg font-medium ${handleFormatDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-indigo-600">{quiz.totalQuestions}</p>
                          <p className="text-xs text-gray-500">Questions</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Created {formatDateDisplay(quiz.createdAt)}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p>No quizzes created yet</p>
                    <Button
                      variant="link"
                      onClick={() => router.push('/teacher/quizzes/create')}
                      className="mt-3"
                    >
                      Create your first quiz
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </FadeInView>

          {/* Your Classes */}
          <FadeInView direction="right" delay={0.4}>
            <Card variant="glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  Your Classes
                </h2>
                <Button
                  variant="link"
                  onClick={() => router.push('/teacher/classes')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4" role="list" aria-label="Your classes">
                {recentClasses.length > 0 ? (
                  recentClasses.map((classItem, index) => (
                    <motion.div
                      key={classItem.classId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => router.push(`/teacher/classes/${classItem.classId}`)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          router.push(`/teacher/classes/${classItem.classId}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1 truncate">{classItem.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-600">Grade {classItem.grade}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" aria-hidden="true" />
                            <span className="text-gray-600">{classItem.subject}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-blue-600">
                            {classItem.studentIds?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p>No classes created yet</p>
                    <Button
                      variant="link"
                      onClick={() => router.push('/teacher/classes')}
                      className="mt-3"
                    >
                      Create your first class
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </FadeInView>
        </div>
      </div>
    </div>
  );
}
