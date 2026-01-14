'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

interface UpcomingQuiz {
  id: string;
  title: string;
  className: string;
  date: string;
  time: string;
  studentCount: number;
}

// Mock data - replace with real data from API
const mockQuizzes: UpcomingQuiz[] = [
  {
    id: '1',
    title: 'Math Quiz - Algebra',
    className: 'Grade 5A',
    date: 'Tomorrow',
    time: '10:00 AM',
    studentCount: 25,
  },
  {
    id: '2',
    title: 'Science - Photosynthesis',
    className: 'Grade 6B',
    date: 'Jan 15, 2026',
    time: '2:00 PM',
    studentCount: 30,
  },
];

export default function UpcomingQuizzes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Scheduled Quizzes</h2>
      
      {mockQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No upcoming quizzes</p>
          <p className="text-sm text-gray-500">Schedule a quiz to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockQuizzes.map((quiz, index) => (
            <QuizCard key={quiz.id} quiz={quiz} delay={index * 0.1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function QuizCard({ quiz, delay }: { quiz: UpcomingQuiz; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.7 }}
      whileHover={{ scale: 1.02 }}
      className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {quiz.title}
          </h3>
          <p className="text-sm text-gray-600">{quiz.className}</p>
        </div>
        <div className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
          {quiz.studentCount} students
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{quiz.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{quiz.time}</span>
        </div>
      </div>
    </motion.div>
  );
}
