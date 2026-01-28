'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TrendPoint } from '@/lib/parentApi';
import { fastTransition, staggerContainer, staggerItem } from '@/components/ui/OptimizedMotion';

interface PerformanceTrendProps {
  data: TrendPoint[];
  loading?: boolean;
}

export default function PerformanceTrend({
  data,
  loading = false,
}: PerformanceTrendProps) {
  // Memoize expensive calculations
  const chartData = useMemo(() => {
    if (!data?.length) return null;
    
    const maxPercentage = Math.max(...data.map((d) => d.percentage));
    const minPercentage = Math.min(...data.map((d) => d.percentage));
    const trend = data.length > 1
      ? data[data.length - 1].percentage - data[0].percentage
      : 0;
    
    return { maxPercentage, minPercentage, trend };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data?.length || !chartData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Trend
        </h3>
        <div className="text-center py-12 text-gray-500">
          No quiz data available yet
        </div>
      </div>
    );
  }

  const { trend } = chartData;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fastTransition}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
        {trend !== 0 && (
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              trend > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-12 right-0 top-0 bottom-0">
          {[0, 25, 50, 75, 100].map((value) => (
            <div
              key={value}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${value}%` }}
            ></div>
          ))}
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-between px-4">
          {data.map((point, index) => (
            <motion.div
              key={index}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${point.percentage}%`, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative flex-1 mx-1 group"
            >
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg hover:from-purple-600 hover:to-pink-600 transition-colors cursor-pointer"
                style={{ height: '100%' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                    <div className="font-semibold">{point.quizTitle}</div>
                    <div className="text-gray-300">
                      Score: {point.percentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(point.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-gray-500 px-4">
          {data.map((point, index) => (
            <div key={index} className="flex-1 text-center">
              {index % Math.ceil(data.length / 5) === 0 && (
                <span>
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Quizzes</p>
          <p className="text-lg font-semibold text-gray-900">{data.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Best</p>
          <p className="text-lg font-semibold text-green-600">
            {maxPercentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Lowest</p>
          <p className="text-lg font-semibold text-orange-600">
            {minPercentage.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
