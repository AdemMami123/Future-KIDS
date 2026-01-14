'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface Activity {
  id: string;
  type: 'quiz_created' | 'game_completed' | 'student_joined' | 'class_created';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof Clock;
  color: string;
}

// Mock data - replace with real data from API
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'quiz_created',
    title: 'Quiz Created',
    description: 'Created "Math Quiz - Chapter 5"',
    timestamp: '2 hours ago',
    icon: CheckCircle,
    color: 'blue',
  },
  {
    id: '2',
    type: 'game_completed',
    title: 'Game Completed',
    description: '25 students participated in "Science Quiz"',
    timestamp: '5 hours ago',
    icon: Users,
    color: 'green',
  },
  {
    id: '3',
    type: 'student_joined',
    title: 'New Student',
    description: 'John Doe joined Class 5A',
    timestamp: '1 day ago',
    icon: Users,
    color: 'purple',
  },
];

export default function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
      
      {mockActivities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockActivities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} delay={index * 0.1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActivityItem({ activity, delay }: { activity: Activity; delay: number }) {
  const Icon = activity.icon;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      dot: 'bg-blue-500',
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      dot: 'bg-green-500',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      dot: 'bg-purple-500',
    },
    orange: {
      bg: 'bg-orange-100',
      icon: 'text-orange-600',
      dot: 'bg-orange-500',
    },
  }[activity.color] || {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    dot: 'bg-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + 0.6 }}
      className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className={`w-12 h-12 ${colorClasses.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{activity.timestamp}</span>
        </div>
      </div>

      {/* Timeline dot */}
      <div className="relative">
        <div className={`w-2 h-2 ${colorClasses.dot} rounded-full`} />
      </div>
    </motion.div>
  );
}
