'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Clock,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { quizAttemptApi } from '@/lib/quizAttemptApi';

interface Answer {
  questionId: string;
  answer: string | number;
  timeSpent: number;
}

export default function QuizAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  // Load attempt and quiz data
  useEffect(() => {
    if (!user) return;

    const loadAttempt = async () => {
      try {
        setLoading(true);
        const attemptData = await quizAttemptApi.getAttempt(attemptId);
        setAttempt(attemptData);
        setQuiz(attemptData.quiz);
        setAnswers(attemptData.answers || []);
        setCurrentQuestionIndex(attemptData.currentQuestionIndex || 0);
      } catch (error) {
        console.error('Error loading attempt:', error);
        router.push('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadAttempt();
  }, [user, attemptId, router]);

  // Auto-save functionality
  const saveProgress = useCallback(async () => {
    if (!hasUnsavedChanges.current) return;

    try {
      setAutoSaving(true);
      await quizAttemptApi.saveProgress(attemptId, answers, currentQuestionIndex);
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [attemptId, answers, currentQuestionIndex]);

  // Set up auto-save interval
  useEffect(() => {
    autoSaveInterval.current = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [saveProgress]);

  // Warn before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string | number) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === questionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { questionId, answer, timeSpent };
        return updated;
      }
      return [...prev, { questionId, answer, timeSpent }];
    });

    hasUnsavedChanges.current = true;
  };

  // Navigation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      hasUnsavedChanges.current = true;
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
      hasUnsavedChanges.current = true;
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
    hasUnsavedChanges.current = true;
  };

  // Flag question for review
  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      await saveProgress(); // Save before submit
      await quizAttemptApi.submitQuiz(attemptId, answers);
      router.push(`/student/quizzes/${params.quizId}/attempts/${attemptId}/results`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setSubmitting(false);
    }
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

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Quiz not found or has no questions</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.questionId);
  const answeredCount = answers.length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              {autoSaving && (
                <div className="ml-4 flex items-center text-sm text-gray-500">
                  <Save className="w-4 h-4 mr-1 animate-pulse" />
                  Saving...
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {currentQuestion.questionText}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {currentQuestion.points} points
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlagQuestion(currentQuestion.questionId)}
                    className={`p-2 rounded-lg transition-colors ${
                      flaggedQuestions.has(currentQuestion.questionId)
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                {/* Question Image */}
                {currentQuestion.questionImageUrl && (
                  <img
                    src={currentQuestion.questionImageUrl}
                    alt="Question"
                    className="w-full max-h-64 object-contain rounded-lg mb-6"
                  />
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'multiple-choice' && (
                    <>
                      {currentQuestion.options.map((option: string, index: number) => (
                        <button
                          key={index}
                          onClick={() =>
                            handleAnswerChange(currentQuestion.questionId, index)
                          }
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            currentAnswer?.answer === index
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                currentAnswer?.answer === index
                                  ? 'border-purple-600 bg-purple-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {currentAnswer?.answer === index && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {currentQuestion.type === 'true-false' && (
                    <>
                      {['True', 'False'].map((option, index) => (
                        <button
                          key={option}
                          onClick={() =>
                            handleAnswerChange(
                              currentQuestion.questionId,
                              option.toLowerCase()
                            )
                          }
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            currentAnswer?.answer === option.toLowerCase()
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                currentAnswer?.answer === option.toLowerCase()
                                  ? 'border-purple-600 bg-purple-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {currentAnswer?.answer === option.toLowerCase() && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {currentQuestion.type === 'short-answer' && (
                    <input
                      type="text"
                      value={(currentAnswer?.answer as string) || ''}
                      onChange={e =>
                        handleAnswerChange(currentQuestion.questionId, e.target.value)
                      }
                      placeholder="Type your answer here..."
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-gray-700 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Previous
                  </button>

                  {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={goToNextQuestion}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {quiz.questions.map((q: any, index: number) => {
                  const isAnswered = answers.some(a => a.questionId === q.questionId);
                  const isFlagged = flaggedQuestions.has(q.questionId);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg font-medium text-sm transition-all relative ${
                        isCurrent
                          ? 'bg-purple-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="w-3 h-3 absolute top-0 right-0 text-yellow-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-semibold text-gray-900">
                    {answeredCount}/{quiz.questions.length}
                  </span>
                </div>
                {flaggedQuestions.size > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Flagged:</span>
                    <span className="font-semibold text-yellow-600">
                      {flaggedQuestions.size}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Submit Quiz?
                </h2>
                <p className="text-gray-600">
                  You have answered {answeredCount} out of {quiz.questions.length}{' '}
                  questions.
                </p>
                {answeredCount < quiz.questions.length && (
                  <p className="text-yellow-600 mt-2">
                    ⚠️ Some questions are unanswered
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Review
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
