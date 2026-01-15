'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface QuestionReviewItem {
  questionNumber: number;
  questionText: string;
  questionImageUrl?: string;
  type: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

interface QuestionReviewProps {
  questions: QuestionReviewItem[];
  showUserAnswers?: boolean;
}

export default function QuestionReview({
  questions,
  showUserAnswers = true,
}: QuestionReviewProps) {
  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <motion.div
          key={question.questionNumber}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-white rounded-xl shadow-md p-6 border-2 ${
            showUserAnswers
              ? question.isCorrect
                ? 'border-green-200'
                : question.userAnswer
                ? 'border-red-200'
                : 'border-gray-200'
              : 'border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                {question.questionNumber}
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  Question {question.questionNumber}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {question.type}
                </div>
              </div>
            </div>

            {showUserAnswers && (
              <div className="flex items-center gap-4">
                {question.userAnswer && (
                  <>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {question.timeSpent}s
                    </div>
                    <div className="flex items-center gap-1">
                      {question.isCorrect ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-600 font-semibold">
                            +{question.points}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-600 font-semibold">0</span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Question */}
          <div className="mb-4">
            <p className="text-lg text-gray-800 mb-3">{question.questionText}</p>
            {question.questionImageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                <Image
                  src={question.questionImageUrl}
                  alt="Question"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
              const isCorrectAnswer = option === question.correctAnswer;
              const isUserAnswer = showUserAnswers && option === question.userAnswer;

              let bgColor = 'bg-gray-50 border-gray-200';
              let textColor = 'text-gray-700';
              let icon = null;

              if (isCorrectAnswer) {
                bgColor = 'bg-green-50 border-green-300';
                textColor = 'text-green-800';
                icon = <CheckCircle className="w-5 h-5 text-green-500" />;
              } else if (isUserAnswer && !question.isCorrect) {
                bgColor = 'bg-red-50 border-red-300';
                textColor = 'text-red-800';
                icon = <XCircle className="w-5 h-5 text-red-500" />;
              }

              return (
                <div
                  key={optionIndex}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 ${bgColor}`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                      isCorrectAnswer
                        ? 'bg-green-500 text-white'
                        : isUserAnswer && !question.isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 border-2 border-gray-300'
                    }`}
                  >
                    {optionLabel}
                  </div>
                  <span className={`flex-1 ${textColor}`}>{option}</span>
                  {icon}
                </div>
              );
            })}
          </div>

          {/* Explanation for unanswered questions */}
          {showUserAnswers && !question.userAnswer && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                No answer submitted for this question
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
