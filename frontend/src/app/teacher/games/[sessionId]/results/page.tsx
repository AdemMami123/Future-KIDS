'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Users,
  Target,
  Clock,
  Download,
  ArrowLeft,
} from 'lucide-react';
import ResultsPodium from '@/components/game/ResultsPodium';
import PerformanceChart from '@/components/game/PerformanceChart';
import QuestionReview from '@/components/game/QuestionReview';
import ShareResults from '@/components/game/ShareResults';
import { gameResultsApi, GameResults } from '@/lib/gameResultsApi';

export default function TeacherResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await gameResultsApi.getGameResults(sessionId);
        setResults(data);

        // Celebrate with confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err: any) {
        console.error('Error loading results:', err);
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId]);

  const handleDownloadCSV = async () => {
    try {
      const { data, filename } = await gameResultsApi.exportResults(
        sessionId,
        'csv'
      );

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
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
            onClick={() => router.push('/teacher/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questionReviewData = results.questionStats.map((stat) => ({
    questionNumber: stat.questionNumber,
    questionText: stat.questionText,
    questionImageUrl: undefined,
    type: 'multiple-choice',
    options: [],
    correctAnswer: '',
    userAnswer: null,
    isCorrect: false,
    points: 0,
    timeSpent: stat.averageTime,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🎉 Game Results
              </h1>
              <p className="text-gray-600">{results.quiz.title}</p>
              <p className="text-sm text-gray-500">
                Code: {results.session.gameCode}
              </p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {results.statistics.totalParticipants}
                </div>
                <div className="text-sm text-gray-500">Participants</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {results.statistics.overallAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {results.statistics.averageScore}
                </div>
                <div className="text-sm text-gray-500">Avg Score</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {results.quiz.totalQuestions}
                </div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🏆 Top Performers
          </h2>
          <ResultsPodium participants={results.leaderboard} />
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <PerformanceChart
              questionStats={results.questionStats}
              type="bar"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <PerformanceChart
              questionStats={results.questionStats}
              type="accuracy"
            />
          </motion.div>
        </div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Full Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Student
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    Correct
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.leaderboard.map((participant) => (
                  <tr
                    key={participant.userId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {participant.rank <= 3 ? (
                          <span className="text-2xl">
                            {participant.rank === 1
                              ? '🥇'
                              : participant.rank === 2
                              ? '🥈'
                              : '🥉'}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-semibold">
                            #{participant.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {participant.userName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-purple-600">
                        {participant.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-600">
                        {participant.correctAnswers}/{participant.totalAnswers}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-600">
                        {(
                          (participant.correctAnswers /
                            participant.totalAnswers) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Question Breakdown
          </h2>
          <div className="space-y-4">
            {results.questionStats.map((stat) => (
              <div
                key={stat.questionId}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800">
                        Question {stat.questionNumber}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stat.percentageCorrect >= 70
                            ? 'bg-green-100 text-green-700'
                            : stat.percentageCorrect >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {stat.percentageCorrect.toFixed(1)}% Correct
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{stat.questionText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-bold text-green-600 text-xl">
                      {stat.correctCount}
                    </div>
                    <div className="text-gray-600">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-bold text-red-600 text-xl">
                      {stat.incorrectCount}
                    </div>
                    <div className="text-gray-600">Incorrect</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-bold text-blue-600 text-xl">
                      {stat.averageTime}s
                    </div>
                    <div className="text-gray-600">Avg Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
