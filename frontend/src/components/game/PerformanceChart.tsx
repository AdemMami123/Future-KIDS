'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface QuestionStat {
  questionNumber: number;
  questionText: string;
  correctCount: number;
  incorrectCount: number;
  percentageCorrect: number;
  averageTime: number;
}

interface PerformanceChartProps {
  questionStats: QuestionStat[];
  type?: 'bar' | 'accuracy';
}

export default function PerformanceChart({
  questionStats,
  type = 'bar',
}: PerformanceChartProps) {
  if (type === 'bar') {
    const data = {
      labels: questionStats.map((q) => `Q${q.questionNumber}`),
      datasets: [
        {
          label: 'Correct',
          data: questionStats.map((q) => q.correctCount),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        },
        {
          label: 'Incorrect',
          data: questionStats.map((q) => q.incorrectCount),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Question Performance',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        tooltip: {
          callbacks: {
            afterLabel: (context: any) => {
              const index = context.dataIndex;
              const stat = questionStats[index];
              return [
                `Accuracy: ${stat.percentageCorrect.toFixed(1)}%`,
                `Avg Time: ${stat.averageTime}s`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            display: false,
          },
        },
        y: {
          stacked: false,
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  }

  // Accuracy Doughnut Chart
  const totalCorrect = questionStats.reduce(
    (sum, q) => sum + q.correctCount,
    0
  );
  const totalIncorrect = questionStats.reduce(
    (sum, q) => sum + q.incorrectCount,
    0
  );
  const totalAnswers = totalCorrect + totalIncorrect;
  const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

  const data = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [totalCorrect, totalIncorrect],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Overall Accuracy',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / totalAnswers) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="h-80 relative">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
