'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quiz } from '@/lib/quizApi';
import {
  XMarkIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ViewQuizModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewQuizModal({ quiz, isOpen, onClose }: ViewQuizModalProps) {
  if (!quiz) return null;

  const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const totalTime = Math.ceil(
    quiz.questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0) / 60
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="relative">
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                  {quiz.coverImageUrl ? (
                    <img
                      src={quiz.coverImageUrl}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white text-6xl font-bold">
                      {quiz.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-700" />
                  </button>

                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.isDraft
                          ? 'bg-yellow-100 text-yellow-800'
                          : quiz.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {quiz.isDraft ? 'Draft' : quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : quiz.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Title Section */}
                <div className="p-6 border-b">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
                  <p className="text-gray-600">{quiz.description}</p>
                  <div className="mt-4 flex items-center space-x-4 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                      {quiz.subject}
                    </span>
                    <span className="text-gray-500">Class ID: {quiz.classId}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-300px)]">
                {/* Quiz Stats */}
                <div className="p-6 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-blue-600">{quiz.totalQuestions}</p>
                      <p className="text-sm text-gray-600">Questions</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-purple-600">{totalPoints}</p>
                      <p className="text-sm text-gray-600">Total Points</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-green-600">{totalTime}</p>
                      <p className="text-sm text-gray-600">Minutes</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-orange-600">{quiz.timeLimit}</p>
                      <p className="text-sm text-gray-600">Time Limit (min)</p>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      {quiz.randomizeQuestions ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">Randomize Questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {quiz.randomizeOptions ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">Randomize Options</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {quiz.showCorrectAnswers ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">Show Correct Answers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {quiz.allowRetake ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">Allow Retake</span>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Questions ({quiz.questions.length})
                  </h3>
                  <div className="space-y-4">
                    {quiz.questions.map((question, index) => (
                      <div
                        key={question.questionId}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Q{index + 1}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {question.type === 'multiple-choice'
                                  ? 'Multiple Choice'
                                  : question.type === 'true-false'
                                  ? 'True/False'
                                  : 'Short Answer'}
                              </span>
                            </div>
                            <p className="text-gray-900 font-medium">{question.questionText}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm ml-4">
                            <div className="flex items-center space-x-1 text-orange-600">
                              <ClockIcon className="w-4 h-4" />
                              <span>{question.timeLimit}s</span>
                            </div>
                            <div className="flex items-center space-x-1 text-green-600">
                              <AcademicCapIcon className="w-4 h-4" />
                              <span>{question.points}pts</span>
                            </div>
                          </div>
                        </div>

                        {/* Question Image */}
                        {question.questionImageUrl && (
                          <img
                            src={question.questionImageUrl}
                            alt="Question"
                            className="w-full max-h-48 object-contain rounded mb-3"
                          />
                        )}

                        {/* Options for Multiple Choice */}
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded border ${
                                  question.correctAnswer === optIndex
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-700">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span className="text-gray-900">{option}</span>
                                  {question.correctAnswer === optIndex && (
                                    <CheckCircleIcon className="w-5 h-5 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Correct Answer for other types */}
                        {question.type !== 'multiple-choice' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                            <p className="text-gray-900 font-medium">{question.correctAnswer}</p>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-gray-600 mb-1">Explanation:</p>
                            <p className="text-gray-900">{question.explanation}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {question.tags && question.tags.length > 0 && (
                          <div className="mt-3 flex items-center space-x-2">
                            {question.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
