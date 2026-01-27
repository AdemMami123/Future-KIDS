'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

export interface AnswerReviewItem {
  questionNumber: number;
  questionId: string;
  questionText: string;
  questionImageUrl?: string;
  type: string;
  options?: string[];
  correctAnswer: string | number;
  userAnswer: string | number | null;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

interface QuestionReviewProps {
  answers: AnswerReviewItem[];
  showCorrectAnswers?: boolean;
}

export default function QuestionReview({ answers, showCorrectAnswers = true }: QuestionReviewProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleExpand = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  return (
    <div className="space-y-3">
      {answers.map((answer, index) => (
        <motion.div
          key={answer.questionId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`bg-white rounded-xl border-2 overflow-hidden ${
            answer.isCorrect ? 'border-green-200' : 'border-red-200'
          }`}
        >
          {/* Question Header */}
          <button
            onClick={() => toggleExpand(answer.questionId)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {answer.isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
              <div className="text-left">
                <span className="font-semibold text-gray-800">
                  Question {answer.questionNumber}
                </span>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {answer.questionText}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`font-bold ${answer.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  +{answer.points} pts
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  {answer.timeSpent}s
                </div>
              </div>
              {expandedQuestion === answer.questionId ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedQuestion === answer.questionId && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t bg-gray-50"
              >
                <div className="p-4 space-y-4">
                  {/* Question Image */}
                  {answer.questionImageUrl && (
                    <div className="relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={answer.questionImageUrl}
                        alt="Question"
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  )}

                  {/* Full Question Text */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Question</h4>
                    <p className="text-gray-800">{answer.questionText}</p>
                  </div>

                  {/* Options for Multiple Choice */}
                  {answer.type === 'multiple-choice' && answer.options && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Options</h4>
                      {answer.options.map((option, optIndex) => {
                        const isCorrectOption = option === answer.correctAnswer || optIndex === answer.correctAnswer;
                        const isUserChoice = option === answer.userAnswer || optIndex === answer.userAnswer;

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                              isCorrectOption
                                ? 'border-green-500 bg-green-50'
                                : isUserChoice && !isCorrectOption
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                              isCorrectOption
                                ? 'bg-green-500 text-white'
                                : isUserChoice
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {getOptionLabel(optIndex)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {isCorrectOption && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {isUserChoice && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False Answer */}
                  {answer.type === 'true-false' && showCorrectAnswers && (
                    <div className="grid grid-cols-2 gap-3">
                      {['True', 'False'].map((option) => {
                        const isCorrectOption = option.toLowerCase() === String(answer.correctAnswer).toLowerCase();
                        const isUserChoice = option.toLowerCase() === String(answer.userAnswer).toLowerCase();

                        return (
                          <div
                            key={option}
                            className={`p-3 rounded-lg border-2 text-center font-medium ${
                              isCorrectOption
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : isUserChoice
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 bg-white text-gray-600'
                            }`}
                          >
                            {option}
                            {isCorrectOption && ' ✓'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer */}
                  {answer.type === 'short-answer' && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Your Answer</h4>
                        <p className={`p-2 rounded border ${
                          answer.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                        }`}>
                          {answer.userAnswer || 'No answer provided'}
                        </p>
                      </div>
                      {showCorrectAnswers && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Correct Answer</h4>
                          <p className="p-2 rounded border border-green-300 bg-green-50">
                            {answer.correctAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
