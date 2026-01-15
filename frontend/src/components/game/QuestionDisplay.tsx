'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface QuestionDisplayProps {
  question: {
    questionId: string;
    questionText: string;
    questionImageUrl?: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    points: number;
  };
  questionIndex: number;
  totalQuestions: number;
}

export default function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
}: QuestionDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            {question.points} points
          </span>
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize">
          {question.type.replace('-', ' ')}
        </span>
      </div>

      {/* Question Image */}
      {question.questionImageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full h-64 mb-6 rounded-xl overflow-hidden"
        >
          <Image
            src={question.questionImageUrl}
            alt="Question illustration"
            fill
            className="object-cover"
          />
        </motion.div>
      )}

      {/* Question Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
          {question.questionText}
        </h2>
      </motion.div>
    </motion.div>
  );
}
