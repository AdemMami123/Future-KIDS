'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizQuestion, uploadQuizImage, generateQuestionId } from '@/lib/quizApi';
import QuestionBank, { saveQuestionToBank } from './QuestionBank';
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  BookmarkIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';

interface QuestionBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onSaveToDraft?: () => void;
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  onChange,
  onSaveToDraft,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    questions.length > 0 ? questions[0].questionId : null
  );
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);

  // Add new question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      questionId: generateQuestionId(),
      questionText: '',
      type: 'multiple-choice',
      options: ['', ''],
      correctAnswer: 0,
      points: 10,
      timeLimit: 30,
      tags: [],
    };

    const updatedQuestions = [...questions, newQuestion];
    onChange(updatedQuestions);
    setExpandedQuestion(newQuestion.questionId);
  };

  // Update question
  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    const updatedQuestions = questions.map((q) =>
      q.questionId === questionId ? { ...q, ...updates } : q
    );
    onChange(updatedQuestions);
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter((q) => q.questionId !== questionId);
    onChange(updatedQuestions);
    
    if (expandedQuestion === questionId && updatedQuestions.length > 0) {
      setExpandedQuestion(updatedQuestions[0].questionId);
    }
  };

  // Move question up
  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    onChange(newQuestions);
  };

  // Move question down
  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    onChange(newQuestions);
  };

  // Handle image upload
  const handleImageUpload = async (questionId: string, file: File) => {
    setUploadingImage(questionId);
    try {
      const imageUrl = await uploadQuizImage(file, 'question');
      updateQuestion(questionId, { questionImageUrl: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  // Add option to multiple choice question
  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.questionId === questionId);
    if (!question || !question.options || question.options.length >= 6) return;

    updateQuestion(questionId, {
      options: [...question.options, ''],
    });
  };

  // Remove option from multiple choice question
  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.questionId === questionId);
    if (!question || !question.options || question.options.length <= 2) return;

    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionId, {
      options: newOptions,
      correctAnswer: question.correctAnswer === optionIndex ? 0 : question.correctAnswer,
    });
  };

  // Update option text
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find((q) => q.questionId === questionId);
    if (!question || !question.options) return;

    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  // Import questions from bank
  const handleImportQuestions = (importedQuestions: QuizQuestion[]) => {
    onChange([...questions, ...importedQuestions]);
  };

  // Save current question to bank
  const saveCurrentQuestionToBank = (questionId: string) => {
    const question = questions.find((q) => q.questionId === questionId);
    if (question) {
      const saved = saveQuestionToBank(question);
      if (saved) {
        alert('Question saved to bank!');
      } else {
        alert('Question already exists in bank');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Bank Modal */}
      <QuestionBank
        isOpen={showQuestionBank}
        onClose={() => setShowQuestionBank(false)}
        onImportQuestions={handleImportQuestions}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
        <button
          type="button"
          onClick={() => setShowQuestionBank(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          <RectangleStackIcon className="w-5 h-5" />
          <span>Question Bank</span>
        </button>
      </div>

      {/* Questions List */}
      <AnimatePresence mode="popLayout">
        {questions.map((question, index) => (
          <motion.div
            key={question.questionId}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors"
          >
            {/* Question Header */}
            <div
              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer flex items-center justify-between"
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === question.questionId ? null : question.questionId
                )
              }
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {question.questionText || 'New Question'}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {question.type === 'multiple-choice'
                        ? 'Multiple Choice'
                        : question.type === 'true-false'
                        ? 'True/False'
                        : 'Short Answer'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {question.points} pts • {question.timeLimit}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Actions */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveCurrentQuestionToBank(question.questionId);
                  }}
                  className="p-2 text-purple-500 hover:text-purple-700"
                  title="Save to Question Bank"
                >
                  <BookmarkIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveQuestionUp(index);
                  }}
                  disabled={index === 0}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUpIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveQuestionDown(index);
                  }}
                  disabled={index === questions.length - 1}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDownIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this question?')) {
                      deleteQuestion(question.questionId);
                    }
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Question Details (Expanded) */}
            <AnimatePresence>
              {expandedQuestion === question.questionId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-6 space-y-6">
                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(question.questionId, {
                            type: e.target.value as QuizQuestion['type'],
                            options:
                              e.target.value === 'multiple-choice'
                                ? ['', '']
                                : e.target.value === 'true-false'
                                ? ['True', 'False']
                                : undefined,
                            correctAnswer: 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestion(question.questionId, {
                            questionText: e.target.value,
                          })
                        }
                        placeholder="Enter your question here..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Question Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Image (Optional)
                      </label>
                      {question.questionImageUrl ? (
                        <div className="relative">
                          <img
                            src={question.questionImageUrl}
                            alt="Question"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(question.questionId, {
                                questionImageUrl: undefined,
                              })
                            }
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(question.questionId, file);
                            }}
                            className="hidden"
                            id={`image-upload-${question.questionId}`}
                          />
                          <label
                            htmlFor={`image-upload-${question.questionId}`}
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                          >
                            {uploadingImage === question.questionId ? (
                              <div className="text-blue-500">Uploading...</div>
                            ) : (
                              <>
                                <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                  Click to upload image
                                </span>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Options (Multiple Choice / True-False) */}
                    {(question.type === 'multiple-choice' ||
                      question.type === 'true-false') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Answer Options *
                        </label>
                        <div className="space-y-3">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`correct-${question.questionId}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() =>
                                  updateQuestion(question.questionId, {
                                    correctAnswer: optionIndex,
                                  })
                                }
                                className="w-5 h-5 text-green-500 focus:ring-2 focus:ring-green-500"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    question.questionId,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                disabled={question.type === 'true-false'}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                              />
                              {question.type === 'multiple-choice' &&
                                question.options &&
                                question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOption(question.questionId, optionIndex)
                                    }
                                    className="p-2 text-red-500 hover:text-red-700"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                )}
                              {question.correctAnswer === optionIndex && (
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>

                        {question.type === 'multiple-choice' &&
                          question.options &&
                          question.options.length < 6 && (
                            <button
                              type="button"
                              onClick={() => addOption(question.questionId)}
                              className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <PlusIcon className="w-5 h-5" />
                              <span>Add Option</span>
                            </button>
                          )}
                      </div>
                    )}

                    {/* Correct Answer (Short Answer) */}
                    {question.type === 'short-answer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer *
                        </label>
                        <input
                          type="text"
                          value={question.correctAnswer as string}
                          onChange={(e) =>
                            updateQuestion(question.questionId, {
                              correctAnswer: e.target.value,
                            })
                          }
                          placeholder="Enter the correct answer"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Points and Time Limit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points *
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) =>
                            updateQuestion(question.questionId, {
                              points: parseInt(e.target.value) || 0,
                            })
                          }
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit (seconds) *
                        </label>
                        <input
                          type="number"
                          value={question.timeLimit}
                          onChange={(e) =>
                            updateQuestion(question.questionId, {
                              timeLimit: parseInt(e.target.value) || 0,
                            })
                          }
                          min="5"
                          step="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Explanation (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation (Optional)
                      </label>
                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) =>
                          updateQuestion(question.questionId, {
                            explanation: e.target.value,
                          })
                        }
                        placeholder="Provide an explanation for the correct answer..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Question Button */}
      <motion.button
        type="button"
        onClick={addQuestion}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 font-medium flex items-center justify-center space-x-2 transition-colors"
      >
        <PlusIcon className="w-6 h-6" />
        <span>Add Question</span>
      </motion.button>

      {/* Questions Summary */}
      {questions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{questions.length}</strong> question{questions.length !== 1 ? 's' : ''} •{' '}
            <strong>
              {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
            </strong>{' '}
            total points •{' '}
            <strong>
              {Math.ceil(
                questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0) / 60
              )}
            </strong>{' '}
            minutes estimated
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionBuilder;
