'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export default function DashboardStats({
  stats,
}: {
  stats: {
    title: string;
    value: number;
    icon: LucideIcon;
    color: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
    },
    orange: {
      bg: 'bg-orange-100',
      icon: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
    },
  }[color] || {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden group cursor-pointer"
    >
      {/* Background gradient effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 ${colorClasses.bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${colorClasses.icon}`} />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
            className="text-3xl font-bold text-gray-900"
          >
            {value}
          </motion.div>
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-50" />
    </motion.div>
  );
}
