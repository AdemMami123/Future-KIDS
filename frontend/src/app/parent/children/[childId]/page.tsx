'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Calendar, TrendingUp, TrendingDown, 
  Award, Clock, BookOpen, Target, BarChart2, Filter 
} from 'lucide-react';
import { 
  ChildInfo, ChildStatistics, QuizAttemptWithQuiz 
} from '@/lib/parentApi';
import { parentApi } from '@/lib/parentApi';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCalendar from '@/components/parent/ActivityCalendar';
import SubjectBreakdown from '@/components/parent/SubjectBreakdown';

type TimeRange = '30' | '90' | '180' | 'all';

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildInfo | null>(null);
  const [stats, setStats] = useState<ChildStatistics | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptWithQuiz[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.userId) return;

    const loadChildData = async () => {
      try {
        setLoading(true);

        // Load child stats
        const timeRangeNum = timeRange === 'all' ? undefined : parseInt(timeRange);
        const statsData = await parentApi.getChildStats(user.userId, childId, timeRangeNum);
        setChild(statsData.child);
        setStats(statsData.statistics);

        // Load all attempts
        const attemptsData = await parentApi.getChildAttempts(user.userId, childId, {
          subject: selectedSubject === 'all' ? undefined : selectedSubject,
        });
        setAttempts(attemptsData.attempts);
      } catch (error) {
        console.error('Error loading child data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildData();
  }, [user, childId, timeRange, selectedSubject]);

  const handleExportData = async () => {
    if (!user || !user.userId || !child) return;

    try {
      const report = await parentApi.generateReport(user.userId, childId, {
        startDate: timeRange === 'all' ? undefined : new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString(),
        subjects: selectedSubject === 'all' ? undefined : selectedSubject,
        includeComparison: true,
      });

      // Create downloadable JSON file
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${child.name}_report_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-white rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!child || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Child not found</p>
          <button
            onClick={() => router.push('/parent/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const subjects = Array.from(new Set(attempts.map(a => a.quiz.subject)));
  const strengths = stats.subjectBreakdown
    .filter(s => s.averagePercentage >= 80)
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, 3);
  const improvements = stats.subjectBreakdown
    .filter(s => s.averagePercentage < 70)
    .sort((a, b) => a.averagePercentage - b.averagePercentage)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/parent/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {child.name}'s Progress
              </h1>
              <p className="text-gray-600 mt-1">
                Grade {child.grade} • Comprehensive Performance Analysis
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 180 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Data
            </button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalQuizzes}</span>
            </div>
            <p className="text-blue-100">Total Quizzes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.averageScore.toFixed(1)}%</span>
            </div>
            <p className="text-purple-100">Average Score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{Math.round(stats.timeSpent / 60)}</span>
            </div>
            <p className="text-orange-100">Minutes Studied</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.streak}</span>
            </div>
            <p className="text-green-100">Day Streak</p>
          </motion.div>
        </div>

        {/* Strengths and Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 border-2 border-green-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Strengths</h3>
                <p className="text-sm text-gray-600">Top performing areas</p>
              </div>
            </div>

            {strengths.length > 0 ? (
              <div className="space-y-4">
                {strengths.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{subject.subject}</span>
                        <span className="text-green-600 font-bold">{subject.averagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600"
                          style={{ width: `${subject.averagePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available yet</p>
            )}
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 border-2 border-blue-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Focus Areas</h3>
                <p className="text-sm text-gray-600">Needs more practice</p>
              </div>
            </div>

            {improvements.length > 0 ? (
              <div className="space-y-4">
                {improvements.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{subject.subject}</span>
                        <span className="text-blue-600 font-bold">{subject.averagePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          style={{ width: `${subject.averagePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Great job! All subjects above 70%</p>
            )}
          </motion.div>
        </div>

        {/* Subject Breakdown */}
        <SubjectBreakdown data={stats.subjectBreakdown} loading={false} />

        {/* Activity Calendar */}
        <ActivityCalendar attempts={attempts} loading={false} />

        {/* Quiz History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complete Quiz History</h3>
                <p className="text-sm text-gray-600">{attempts.length} total attempts</p>
              </div>
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quiz</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, index) => {
                    const percentage = (attempt.score / attempt.totalScore) * 100;
                    const date = attempt.completedAt 
                      ? new Date(attempt.completedAt).toLocaleDateString() 
                      : 'In Progress';

                    return (
                      <motion.tr
                        key={attempt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">{date}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {attempt.quiz.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                            {attempt.quiz.subject}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">
                          {attempt.score}/{attempt.totalScore}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                          {Math.round(attempt.timeSpent / 60)}m
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No quiz attempts yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
