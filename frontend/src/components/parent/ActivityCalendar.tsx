'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface ActivityCalendarProps {
  attempts: any[];
  loading?: boolean;
}

export default function ActivityCalendar({
  attempts,
  loading = false,
}: ActivityCalendarProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Generate last 30 days
  const getDaysArray = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysArray();

  // Count quizzes per day
  const activityMap = new Map<string, number>();
  attempts.forEach((attempt) => {
    if (attempt.completedAt) {
      try {
        // Handle both string dates and Date objects
        const dateValue = typeof attempt.completedAt === 'string' 
          ? attempt.completedAt 
          : attempt.completedAt instanceof Date 
            ? attempt.completedAt.toISOString() 
            : null;
        
        if (dateValue) {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const dateKey = date.toISOString().split('T')[0];
            activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
          }
        }
      } catch (error) {
        console.warn('Invalid date in attempt:', attempt.completedAt);
      }
    }
  });

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-green-200';
    if (count === 2) return 'bg-green-400';
    if (count === 3) return 'bg-green-500';
    return 'bg-green-600';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const groupedByWeek: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    groupedByWeek.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Calendar</h3>
        </div>
        <span className="text-sm text-gray-500">Last 30 days</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col min-w-full">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-12"></div>
            {weekDays.map((day) => (
              <div
                key={day}
                className="w-10 text-xs text-gray-500 text-center font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {groupedByWeek.map((week, weekIndex) => (
            <div key={weekIndex} className="flex mb-1">
              <div className="w-12 text-xs text-gray-500 flex items-center">
                {weekIndex === 0 && 'Week'}
              </div>
              {week.map((day, dayIndex) => {
                const dateKey = day.toISOString().split('T')[0];
                const count = activityMap.get(dateKey) || 0;

                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    className="w-10 h-8 p-1"
                  >
                    <div
                      className={`w-full h-full rounded ${getIntensityColor(
                        count
                      )} hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer group relative`}
                      title={`${day.toLocaleDateString()}: ${count} quiz${
                        count !== 1 ? 'zes' : ''
                      }`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                          <div className="font-semibold">
                            {day.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-gray-300">
                            {count} quiz{count !== 1 ? 'zes' : ''}
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-4 h-4 rounded ${getIntensityColor(level)}`}
              ></div>
            ))}
          </div>
          <span className="ml-2">More</span>
        </div>
        <div className="text-sm text-gray-600">
          {activityMap.size} active days
        </div>
      </div>
    </div>
  );
}
