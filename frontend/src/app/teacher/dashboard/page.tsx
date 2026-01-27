'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  Sparkles
} from 'lucide-react';

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
  const router = useRouter();
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

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
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
      
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
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
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome back, {user?.firstName}!
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Here&apos;s your teaching overview for today
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards - Modern Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalClasses}</h3>
            <p className="text-gray-600 font-medium">Total Classes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalStudents}</h3>
            <p className="text-gray-600 font-medium">Total Students</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalQuizzes}</h3>
            <p className="text-gray-600 font-medium">Quizzes Created</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Live</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.activeGames}</h3>
            <p className="text-gray-600 font-medium">Active Games</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/teacher/quizzes/create')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <Plus className="w-6 h-6" />
              <span className="font-semibold">Create Quiz</span>
            </button>
            <button
              onClick={() => router.push('/teacher/games/create')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <Gamepad2 className="w-6 h-6" />
              <span className="font-semibold">Start Game</span>
            </button>
            <button
              onClick={() => router.push('/teacher/classes')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <GraduationCap className="w-6 h-6" />
              <span className="font-semibold">Manage Classes</span>
            </button>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Created Quizzes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-600" />
                Recent Quizzes
              </h2>
              <button
                onClick={() => router.push('/teacher/quizzes')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.quizId || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (quiz.quizId) {
                        router.push(`/teacher/quizzes/${quiz.quizId}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{quiz.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
                            {quiz.subject}
                          </span>
                          <span className={`px-2 py-1 rounded-lg font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                            {quiz.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{quiz.totalQuestions}</p>
                        <p className="text-xs text-gray-500">Questions</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Created {formatDate(quiz.createdAt)}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No quizzes created yet</p>
                  <button
                    onClick={() => router.push('/teacher/quizzes/create')}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Create your first quiz
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Your Classes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Your Classes
              </h2>
              <button
                onClick={() => router.push('/teacher/classes')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-sm"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentClasses.length > 0 ? (
                recentClasses.map((classItem, index) => (
                  <motion.div
                    key={classItem.classId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/teacher/classes/${classItem.classId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">{classItem.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Grade {classItem.grade}</span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="text-gray-600">{classItem.subject}</span>
                        </div>
                      </div>
                      <div className="text-right">
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
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No classes created yet</p>
                  <button
                    onClick={() => router.push('/teacher/classes')}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Create your first class
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
