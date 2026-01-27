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
  RefreshCw,
} from 'lucide-react';
import QuestionReview from '@/components/game/QuestionReview';
import ShareResults from '@/components/game/ShareResults';
import { gameResultsApi, UserResults, ParticipantResult } from '@/lib/gameResultsApi';
import { useAuth } from '@/contexts/AuthContext';

// Cached results from socket
interface CachedResults {
  sessionId: string;
  leaderboard: ParticipantResult[];
  totalParticipants: number;
}

export default function StudentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<UserResults | null>(null);
  const [cachedResults, setCachedResults] = useState<CachedResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  // Load cached results immediately
  useEffect(() => {
    const cached = sessionStorage.getItem(`game-results-${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCachedResults(parsed);
        // Celebrate immediately with cached data
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error('Failed to parse cached results:', e);
      }
    }
  }, [sessionId]);

  // Load full results from API
  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;

      try {
        const data = await gameResultsApi.getUserResults(sessionId, user.userId);
        setResults(data);
        setError('');

        // Clear cached results
        sessionStorage.removeItem(`game-results-${sessionId}`);

        // Celebrate based on performance (only if not already from cache)
        if (!cachedResults && data.performance.accuracy >= 80) {
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
        } else if (!cachedResults && data.performance.accuracy >= 60) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err: any) {
        console.error('Error loading results:', err);
        if (!cachedResults) {
          setError(err.response?.data?.message || err.message || 'Failed to load results');
        }
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId, user, cachedResults]);

  const handleRetry = async () => {
    if (!user) return;
    setRetrying(true);
    try {
      const data = await gameResultsApi.getUserResults(sessionId, user.userId);
      setResults(data);
      setError('');
      sessionStorage.removeItem(`game-results-${sessionId}`);
    } catch (err: any) {
      console.error('Error retrying:', err);
      setError(err.response?.data?.message || 'Failed to load detailed results');
    } finally {
      setRetrying(false);
    }
  };

  // Find current user in cached leaderboard
  const cachedUserResult = cachedResults?.leaderboard?.find(
    (p) => p.userId === user?.userId
  );

  const getMotivationalMessage = (accuracy: number) => {
    if (accuracy >= 90) {
      return {
        emoji: '🌟',
        title: 'Outstanding!',
        message: "You're a quiz champion! Your knowledge and quick thinking are impressive!",
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    } else if (accuracy >= 80) {
      return {
        emoji: '🎉',
        title: 'Excellent Work!',
        message: "Great job! You've mastered this topic and showed strong understanding!",
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    } else if (accuracy >= 70) {
      return {
        emoji: '👍',
        title: 'Well Done!',
        message: "Nice work! You're on the right track. Keep practicing to improve even more!",
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    } else if (accuracy >= 60) {
      return {
        emoji: '💪',
        title: 'Good Effort!',
        message: "You're making progress! Review the questions you missed and try again!",
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      };
    } else if (accuracy >= 50) {
      return {
        emoji: '📚',
        title: 'Keep Learning!',
        message: "Don't give up! Practice makes perfect. Review the material and you'll do better next time!",
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      };
    } else {
      return {
        emoji: '🎯',
        title: 'Keep Trying!',
        message: "Every expert was once a beginner. Use this as a learning opportunity and come back stronger!",
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      };
    }
  };

  // Show loading only if we have no data at all
  if (loading && !cachedResults && !cachedUserResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Show error only if we have no data at all
  if (!results && !cachedUserResult) {
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

  // Use data from API or cached results
  const hasFullResults = !!results;
  const score = results?.participant?.score ?? cachedUserResult?.score ?? 0;
  const rank = results?.participant?.rank ?? cachedUserResult?.rank ?? 0;
  const totalParticipants = results?.participant?.totalParticipants ?? cachedResults?.totalParticipants ?? 0;
  const correctAnswers = results?.performance?.correctAnswers ?? cachedUserResult?.correctAnswers ?? 0;
  const totalQuestions = results?.performance?.totalQuestions ?? cachedUserResult?.totalAnswers ?? 0;
  const accuracy = results?.performance?.accuracy ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);

  const motivational = getMotivationalMessage(accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Loading Full Results Banner */}
        {!hasFullResults && cachedUserResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-700">Loading detailed results...</span>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              Retry
            </button>
          </motion.div>
        )}

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
          <p className="text-gray-600">{results?.quiz?.title || 'Quiz Results'}</p>
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
                {score}
              </div>
              <div className="text-sm opacity-90">Total Score</div>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                #{rank}
              </div>
              <div className="text-sm opacity-90">
                of {totalParticipants}
              </div>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {accuracy.toFixed(1)}%
              </div>
              <div className="text-sm opacity-90">Accuracy</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-sm opacity-90">Correct</div>
            </div>
          </div>
        </motion.div>

        {/* Performance Comparison - Only show with full results */}
        {hasFullResults && results?.performance?.classAverage !== undefined && (
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
                    {score} pts
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (score / Math.max(results.performance.classAverage * 1.5, score)) * 100,
                        100
                      )}%`,
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
                    {results.performance.classAverage} pts
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (results.performance.classAverage / Math.max(results.performance.classAverage * 1.5, score)) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="h-full bg-gray-400"
                  />
                </div>
              </div>

              {/* Comparison Message */}
              <div className="text-center pt-2">
                {results.performance.comparisonToAverage > 0 ? (
                  <p className="text-green-600 font-medium">
                    🎉 You scored {results.performance.comparisonToAverage.toFixed(0)}% above average!
                  </p>
                ) : results.performance.comparisonToAverage < 0 ? (
                  <p className="text-orange-600 font-medium">
                    Keep practicing! You&apos;re {Math.abs(results.performance.comparisonToAverage).toFixed(0)}% below the class average.
                  </p>
                ) : (
                  <p className="text-blue-600 font-medium">
                    You scored exactly at the class average!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Share Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <ShareResults
            title="My Quiz Results"
            score={score}
            rank={rank}
            totalParticipants={totalParticipants}
            quizTitle={results?.quiz?.title || 'Quiz'}
          />
        </motion.div>

        {/* Question Review - Only show with full results */}
        {hasFullResults && results?.answerReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Question Review
            </h2>
            <QuestionReview answers={results.answerReview} showCorrectAnswers={true} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
