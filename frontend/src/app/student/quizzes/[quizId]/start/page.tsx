'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  FileQuestion,
  AlertCircle,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { quizAttemptApi } from '@/lib/quizAttemptApi';
import api from '@/lib/api';

export default function QuizStartPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<'practice' | 'graded'>('practice');
  const [incompleteAttempt, setIncompleteAttempt] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadQuizData = async () => {
      try {
        setLoading(true);

        // Load quiz details
        const quizResponse = await api.get(`/quizzes/${quizId}`);
        setQuiz(quizResponse?.quiz || null);

        // Check for incomplete attempts
        const incompleteAttempts = await quizAttemptApi.getIncompleteAttempts(user.userId);
        const existingAttempt = incompleteAttempts.find(
          (attempt: any) => attempt.quizId === quizId
        );
        setIncompleteAttempt(existingAttempt || null);
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [user, quizId]);

  const handleStartQuiz = async () => {
    if (!user || !quiz) return;

    try {
      setStarting(true);
      const attempt = await quizAttemptApi.startAttempt(quizId, user.userId, mode);
      router.push(`/student/quizzes/${quizId}/attempt/${attempt.attemptId}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      setStarting(false);
    }
  };

  const handleResumeQuiz = () => {
    if (!incompleteAttempt) return;
    router.push(`/student/quizzes/${quizId}/attempt/${incompleteAttempt.attemptId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Quiz not found</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="mt-4 text-purple-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Resume Banner */}
        {incompleteAttempt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start justify-between"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">
                  You have an incomplete attempt
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  You can resume where you left off or start a new attempt.
                </p>
              </div>
            </div>
            <button
              onClick={handleResumeQuiz}
              className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
            >
              Resume
            </button>
          </motion.div>
        )}

        {/* Quiz Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Quiz Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            {quiz.coverImageUrl && (
              <img
                src={quiz.coverImageUrl}
                alt={quiz.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description}</p>
          </div>

          {/* Quiz Info Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <FileQuestion className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.questions?.length || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Clock className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.timeLimit ? `${quiz.timeLimit}m` : 'None'}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                {quiz.difficulty?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {quiz.difficulty || 'Medium'}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Read each question carefully before answering</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>You can navigate between questions using Previous/Next buttons</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Your progress is automatically saved every 30 seconds</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>Review your answers before submitting the quiz</span>
              </li>
            </ul>
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quiz Mode</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('practice')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'practice'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Practice Mode</h3>
                  {mode === 'practice' && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-left">
                  No pressure! Take your time and learn from your mistakes.
                </p>
              </button>

              <button
                onClick={() => setMode('graded')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'graded'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Graded Mode</h3>
                  {mode === 'graded' && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-left">
                  Your score will be recorded and visible to your teacher.
                </p>
              </button>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartQuiz}
            disabled={starting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Starting Quiz...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Quiz
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
