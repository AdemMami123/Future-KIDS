'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket } from '@/hooks/useSocket';
import { Quiz, getTeacherQuizzes } from '@/lib/quizApi';
import { getTeacherClasses } from '@/lib/classApi';
import {
  RocketLaunchIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function CreateGamePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createGame, isConnected } = useGameSocket();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showAnswers, setShowAnswers] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      const [quizzesData, classesData] = await Promise.all([
        getTeacherQuizzes(user.userId),
        getTeacherClasses(user.userId),
      ]);

      setQuizzes(quizzesData.filter((q: Quiz) => !q.isDraft && q.isActive));
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = () => {
    if (!selectedQuizId || !selectedClassId || !user?.userId) {
      alert('Please select a quiz and class');
      return;
    }

    setCreating(true);

    createGame(
      {
        quizId: selectedQuizId,
        teacherId: user.userId,
        classId: selectedClassId,
        settings: {
          showAnswers,
          showLeaderboard,
        },
      },
      (response) => {
        setCreating(false);

        if (response.success && response.sessionId) {
          // Store game code in localStorage for the lobby page
          if (response.gameCode) {
            localStorage.setItem(`gameCode_${response.sessionId}`, response.gameCode);
          }
          router.push(`/teacher/games/${response.sessionId}/lobby`);
        } else {
          alert(response.error || 'Failed to create game');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const selectedQuiz = quizzes.find((q) => q.quizId === selectedQuizId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <RocketLaunchIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Live Game</h1>
          <p className="text-gray-600 text-lg">
            Set up a real-time quiz game for your students
          </p>
          {!isConnected && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <XCircleIcon className="w-5 h-5" />
              <span>Connecting to server...</span>
            </div>
          )}
          {isConnected && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Connected and ready</span>
            </div>
          )}
        </motion.div>

        {/* Setup Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Select Quiz */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              1. Select Quiz
            </label>
            {quizzes.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  No active quizzes available. Create a quiz first.
                </p>
                <button
                  onClick={() => router.push('/teacher/quizzes/create')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <button
                    key={quiz.quizId}
                    onClick={() => setSelectedQuizId(quiz.quizId!)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedQuizId === quiz.quizId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {quiz.description}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{quiz.totalQuestions} questions</span>
                      <span>•</span>
                      <span className="capitalize">{quiz.difficulty}</span>
                      <span>•</span>
                      <span>{quiz.subject}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select Class */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              2. Select Class
            </label>
            {classes.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  No classes available. Create a class first.
                </p>
                <button
                  onClick={() => router.push('/teacher/classes')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <button
                    key={cls.classId}
                    onClick={() => setSelectedClassId(cls.classId)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedClassId === cls.classId
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span>{cls.studentIds?.length || 0} students</span>
                      <span>•</span>
                      <span>{cls.subject}</span>
                      <span>•</span>
                      <span>Grade {cls.grade}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game Settings */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              3. Game Settings
            </label>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Show Correct Answers</p>
                  <p className="text-sm text-gray-600">
                    Display correct answers after each question
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                  className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Show Leaderboard</p>
                  <p className="text-sm text-gray-600">
                    Display live leaderboard during the game
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showLeaderboard}
                  onChange={(e) => setShowLeaderboard(e.target.checked)}
                  className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Summary */}
          {selectedQuiz && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3">Game Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Quiz:</p>
                  <p className="font-medium text-gray-900">{selectedQuiz.title}</p>
                </div>
                <div>
                  <p className="text-gray-600">Questions:</p>
                  <p className="font-medium text-gray-900">
                    {selectedQuiz.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Class:</p>
                  <p className="font-medium text-gray-900">
                    {classes.find((c) => c.classId === selectedClassId)?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Difficulty:</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedQuiz.difficulty}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGame}
              disabled={
                !selectedQuizId ||
                !selectedClassId ||
                creating ||
                !isConnected
              }
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Game...</span>
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="w-5 h-5" />
                  <span>Create Game</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
