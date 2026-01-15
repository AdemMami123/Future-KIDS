'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  TrendingUp,
  Target,
  Award,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import QuestionReview from '@/components/game/QuestionReview';
import ShareResults from '@/components/game/ShareResults';
import { gameResultsApi, UserResults } from '@/lib/gameResultsApi';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<UserResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;

      try {
        const data = await gameResultsApi.getUserResults(sessionId, user.userId);
        setResults(data);

        // Celebrate based on performance
        if (data.performance.accuracy >= 80) {
          // Great performance - lots of confetti
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
          });
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 250);
        } else if (data.performance.accuracy >= 60) {
          // Good performance - moderate confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err: any) {
        console.error('Error loading results:', err);
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId, user]);

  const getMotivationalMessage = (accuracy: number) => {
    if (accuracy >= 90) {
      return {
        emoji: '🌟',
        title: 'Outstanding!',
        message:
          "You're a quiz champion! Your knowledge and quick thinking are impressive!",
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    } else if (accuracy >= 80) {
      return {
        emoji: '🎉',
        title: 'Excellent Work!',
        message:
          "Great job! You've mastered this topic and showed strong understanding!",
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    } else if (accuracy >= 70) {
      return {
        emoji: '👍',
        title: 'Well Done!',
        message:
          "Nice work! You're on the right track. Keep practicing to improve even more!",
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    } else if (accuracy >= 60) {
      return {
        emoji: '💪',
        title: 'Good Effort!',
        message:
          "You're making progress! Review the questions you missed and try again!",
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      };
    } else if (accuracy >= 50) {
      return {
        emoji: '📚',
        title: 'Keep Learning!',
        message:
          "Don't give up! Practice makes perfect. Review the material and you'll do better next time!",
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      };
    } else {
      return {
        emoji: '🎯',
        title: 'Keep Trying!',
        message:
          "Every expert was once a beginner. Use this as a learning opportunity and come back stronger!",
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Results not found'}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const motivational = getMotivationalMessage(results.performance.accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
            Your Results
          </h1>
          <p className="text-gray-600">{results.quiz.title}</p>
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${motivational.bgColor} rounded-xl shadow-lg p-8 mb-8 text-center`}
        >
          <div className="text-6xl mb-4">{motivational.emoji}</div>
          <h2 className={`text-3xl font-bold ${motivational.color} mb-2`}>
            {motivational.title}
          </h2>
          <p className="text-gray-700 text-lg">{motivational.message}</p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 mb-8 text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {results.participant.score}
              </div>
              <div className="text-sm opacity-90">Total Score</div>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                #{results.participant.rank}
              </div>
              <div className="text-sm opacity-90">
                of {results.participant.totalParticipants}
              </div>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {results.performance.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm opacity-90">Accuracy</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {results.performance.correctAnswers}/
                {results.performance.totalQuestions}
              </div>
              <div className="text-sm opacity-90">Correct</div>
            </div>
          </div>
        </motion.div>

        {/* Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Class Comparison
          </h3>

          <div className="space-y-4">
            {/* Your Score */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Your Score
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {results.participant.score}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (results.participant.score /
                        (results.performance.classAverage * 2)) *
                      100
                    }%`,
                  }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>

            {/* Class Average */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Class Average
                </span>
                <span className="text-sm font-bold text-gray-600">
                  {results.performance.classAverage}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (results.performance.classAverage /
                        (results.performance.classAverage * 2)) *
                      100
                    }%`,
                  }}
                  transition={{ delay: 0.7, duration: 1 }}
                  className="h-full bg-gray-400"
                />
              </div>
            </div>

            {/* Comparison Message */}
            <div className="text-center pt-2">
              {results.performance.comparisonToAverage >= 0 ? (
                <p className="text-green-600 font-medium">
                  🎉 You scored{' '}
                  {Math.abs(results.performance.comparisonToAverage).toFixed(1)}
                  % above the class average!
                </p>
              ) : (
                <p className="text-orange-600 font-medium">
                  You scored{' '}
                  {Math.abs(results.performance.comparisonToAverage).toFixed(1)}
                  % below the class average. Keep practicing!
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Share Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <ShareResults
            sessionId={sessionId}
            quizTitle={results.quiz.title}
            score={results.participant.score}
            rank={results.participant.rank}
            totalParticipants={results.participant.totalParticipants}
          />
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Question Review
          </h2>
          <QuestionReview
            questions={results.answerReview}
            showUserAnswers={true}
          />
        </motion.div>
      </div>
    </div>
  );
}
