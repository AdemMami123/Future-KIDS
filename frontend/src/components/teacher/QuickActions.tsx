'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, Gamepad2, Plus } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
  href: string;
}

const actions: QuickAction[] = [
  {
    title: 'View Classes',
    description: 'Manage your classes and students',
    icon: Users,
    color: 'purple',
    href: '/teacher/classes',
  },
  {
    title: 'Create Quiz',
    description: 'Build a new interactive quiz',
    icon: BookOpen,
    color: 'blue',
    href: '/teacher/quizzes/create',
  },
  {
    title: 'Start Game',
    description: 'Launch a live quiz session',
    icon: Gamepad2,
    color: 'green',
    href: '/teacher/games/create',
  },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-8"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <ActionCard key={action.title} action={action} delay={index * 0.1} />
        ))}
      </div>
    </motion.div>
  );
}

function ActionCard({ action, delay }: { action: QuickAction; delay: number }) {
  const Icon = action.icon;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: 'text-blue-600',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      icon: 'text-green-600',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: 'text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      icon: 'text-orange-600',
      border: 'border-orange-200',
    },
  }[action.color] || {
    bg: 'bg-blue-50 hover:bg-blue-100',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  };

  return (
    <motion.a
      href={action.href}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-xl p-6 transition-all duration-200 cursor-pointer group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
          <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
          <p className="text-sm text-gray-600">{action.description}</p>
        </div>
      </div>
    </motion.a>
  );
}
