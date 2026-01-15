'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Award, PlayCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface QuizCardProps {
  quiz: {
    quizId: string;
    title: string;
    description: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    totalQuestions: number;
    timeLimit: number;
    coverImageUrl?: string;
    isCompleted: boolean;
  };
  onStart: (quizId: string) => void;
}

export default function QuizCard({ quiz, onStart }: QuizCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  const difficultyIcons = {
    easy: '😊',
    medium: '🤔',
    hard: '💪',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-purple-300 transition-all"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
        {quiz.coverImageUrl ? (
          <Image
            src={quiz.coverImageUrl}
            alt={quiz.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/50" />
          </div>
        )}
        
        {/* Completed Badge */}
        {quiz.isCompleted && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        )}

        {/* Difficulty Badge */}
        <div className="absolute bottom-4 left-4">
          <span
            className={`${difficultyColors[quiz.difficulty]} px-3 py-1 rounded-full text-sm font-semibold capitalize flex items-center gap-1`}
          >
            {difficultyIcons[quiz.difficulty]} {quiz.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Subject Tag */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            {quiz.subject}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {quiz.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {quiz.description}
        </p>

        {/* Quiz Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{quiz.totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{quiz.timeLimit}s each</span>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={() => onStart(quiz.quizId)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
            quiz.isCompleted
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {quiz.isCompleted ? (
            <>
              <Award className="w-5 h-5" />
              Review Quiz
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Start Quiz
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
