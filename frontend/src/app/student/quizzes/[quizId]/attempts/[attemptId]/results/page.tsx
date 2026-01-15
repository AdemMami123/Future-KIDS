'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { quizAttemptApi } from '@/lib/quizAttemptApi';

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const attemptId = params.attemptId as string;
  const quizId = params.quizId as string;

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadResults = async () => {
      try {
        setLoading(true);
        const resultsData = await quizAttemptApi.getResults(attemptId);
        setResults(resultsData);

        // Animate score counter
        let currentScore = 0;
        const targetScore = resultsData.percentage;
        const increment = targetScore / 50;
        const timer = setInterval(() => {
          currentScore += increment;
          if (currentScore >= targetScore) {
            setAnimatedScore(targetScore);
            clearInterval(timer);
          } else {
            setAnimatedScore(Math.floor(currentScore));
          }
        }, 20);

        return () => clearInterval(timer);
      } catch (error) {
        console.error('Error loading results:', error);
        router.push('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [user, attemptId, router]);

  const handleRetry = () => {
    router.push(`/student/quizzes/${quizId}/start`);
  };

  const handleBackToDashboard = () => {
    router.push('/student/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Results not found</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 80) return 'from-blue-500 to-cyan-500';
    if (percentage >= 70) return 'from-yellow-500 to-amber-500';
    if (percentage >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBackToDashboard}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r ${getScoreBgColor(
                results.percentage
              )} flex items-center justify-center shadow-lg`}
            >
              <Trophy className="w-16 h-16 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Completed!
            </h1>
            <p className="text-gray-600 mb-6">{results.quiz?.title}</p>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className={`text-7xl font-bold ${getScoreColor(results.percentage)}`}>
                {animatedScore}%
              </div>
              <p className="text-xl text-gray-600 mt-2">
                {results.score} / {results.totalPoints} points
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-gray-700 italic"
            >
              "{results.feedback}"
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {results.correctAnswers}/{results.totalQuestions}
              </div>
              <div className="text-sm text-blue-700">Correct Answers</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {formatTime(results.timeSpent || 0)}
              </div>
              <div className="text-sm text-purple-700">Time Spent</div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
              <TrendingUp className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-pink-900">
                {results.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-pink-700">Success Rate</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </button>
          </div>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Question Review
          </h2>

          <div className="space-y-4">
            {results.questionResults?.map((qr: any, index: number) => (
              <motion.div
                key={qr.questionId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`border-2 rounded-xl p-4 ${
                  qr.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {qr.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      )}
                      <span className="font-semibold text-gray-900">
                        Question {index + 1}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-3">{qr.questionText}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      qr.isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {qr.pointsEarned}/{qr.pointsAvailable} pts
                  </div>
                </div>

                <div className="space-y-2 ml-7">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Your answer:
                    </span>
                    <span
                      className={`ml-2 ${
                        qr.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {qr.studentAnswer?.toString() || 'No answer'}
                    </span>
                  </div>

                  {!qr.isCorrect && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Correct answer:
                      </span>
                      <span className="ml-2 text-green-700">
                        {qr.correctAnswer?.toString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            💡 Tips for Improvement
          </h3>
          <ul className="space-y-2 text-gray-700">
            {results.percentage < 70 && (
              <>
                <li>• Review the questions you got wrong</li>
                <li>• Study the material again before retaking</li>
                <li>• Ask your teacher for help on difficult topics</li>
              </>
            )}
            {results.percentage >= 70 && results.percentage < 90 && (
              <>
                <li>• You're doing well! Focus on the questions you missed</li>
                <li>• Practice similar questions to master the concepts</li>
                <li>• Try to improve your time management</li>
              </>
            )}
            {results.percentage >= 90 && (
              <>
                <li>• Excellent work! You've mastered this material</li>
                <li>• Help your classmates who might be struggling</li>
                <li>• Challenge yourself with more advanced topics</li>
              </>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
