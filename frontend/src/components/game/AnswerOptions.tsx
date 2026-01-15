'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface AnswerOptionsProps {
  options: string[];
  selectedAnswer: string | number | null;
  onSelect: (answer: string | number) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  correctAnswer?: string | number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function AnswerOptions({
  options,
  selectedAnswer,
  onSelect,
  disabled = false,
  showCorrect = false,
  correctAnswer,
}: AnswerOptionsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getOptionColor = (option: string, index: number) => {
    if (showCorrect && correctAnswer !== undefined) {
      if (option === correctAnswer) {
        return 'bg-green-100 border-green-500 text-green-900';
      }
      if (option === selectedAnswer && option !== correctAnswer) {
        return 'bg-red-100 border-red-500 text-red-900';
      }
    }

    if (selectedAnswer === option) {
      return 'bg-blue-100 border-blue-500 text-blue-900';
    }

    if (hoveredIndex === index && !disabled) {
      return 'bg-gray-50 border-gray-300 text-gray-900';
    }

    return 'bg-white border-gray-200 text-gray-700 hover:border-blue-300';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {options.map((option, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={() => !disabled && onSelect(option)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          disabled={disabled}
          className={`
            relative p-6 rounded-xl border-2 transition-all duration-200
            ${getOptionColor(option, index)}
            ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
            flex items-center gap-4 text-left
          `}
        >
          {/* Option Label */}
          <div
            className={`
            w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
            ${selectedAnswer === option ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
            ${showCorrect && correctAnswer === option ? 'bg-green-500 text-white' : ''}
            ${showCorrect && selectedAnswer === option && option !== correctAnswer ? 'bg-red-500 text-white' : ''}
          `}
          >
            {OPTION_LABELS[index]}
          </div>

          {/* Option Text */}
          <span className="flex-1 font-medium text-lg">{option}</span>

          {/* Checkmark for correct answer */}
          {showCorrect && correctAnswer === option && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          )}

          {/* X mark for wrong answer */}
          {showCorrect &&
            selectedAnswer === option &&
            option !== correctAnswer && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.div>
            )}
        </motion.button>
      ))}
    </div>
  );
}
