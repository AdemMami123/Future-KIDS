'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  data: Array<{
    date: Date;
    score: number;
    percentage: number;
  }>;
  metric?: 'score' | 'percentage';
}

export default function PerformanceChart({
  data,
  metric = 'percentage',
}: PerformanceChartProps) {
  // Sort by date and take last 10
  const sortedData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10);

  const chartData = {
    labels: sortedData.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    ),
    datasets: [
      {
        label: metric === 'score' ? 'Score' : 'Accuracy %',
        data: sortedData.map((d) => (metric === 'score' ? d.score : d.percentage)),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(147, 51, 234)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Performance Trend',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(147, 51, 234, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return metric === 'score'
              ? `Score: ${value}`
              : `Accuracy: ${value.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        max: metric === 'percentage' ? 100 : undefined,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: (value: any) => {
            return metric === 'percentage' ? `${value}%` : value;
          },
        },
      },
    },
  };

  if (sortedData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold mb-2">No Data Yet</p>
          <p className="text-sm">Complete quizzes to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
