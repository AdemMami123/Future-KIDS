'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Mail, Calendar, Filter, 
  BookOpen, TrendingUp, Clock, Award, AlertCircle 
} from 'lucide-react';
import { ChildInfo, ProgressReport } from '@/lib/parentApi';
import { parentApi } from '@/lib/parentApi';
import { useAuth } from '@/contexts/AuthContext';
import ChildSelector from '@/components/parent/ChildSelector';

type ReportType = 'summary' | 'detailed' | 'comparison';

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Report Options
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [includeComparison, setIncludeComparison] = useState(true);

  // Available subjects (from all quizzes)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadChildren = async () => {
      try {
        setLoading(true);
        const data = await parentApi.getChildren(user.userId);
        setChildren(data);

        if (data.length > 0) {
          setSelectedChildId(data[0].childId);

          // Load attempts to get subjects
          const attemptsData = await parentApi.getChildAttempts(user.userId, data[0].childId, {});
          const subjects = Array.from(new Set(attemptsData.attempts.map(a => a.quiz.subject)));
          setAvailableSubjects(subjects);
        }
      } catch (error) {
        console.error('Error loading children:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [user]);

  // Load subjects when child changes
  useEffect(() => {
    if (!user || !selectedChildId) return;

    const loadSubjects = async () => {
      try {
        const attemptsData = await parentApi.getChildAttempts(user.userId, selectedChildId, {});
        const subjects = Array.from(new Set(attemptsData.attempts.map(a => a.quiz.subject)));
        setAvailableSubjects(subjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    };

    loadSubjects();
  }, [user, selectedChildId]);

  const handleGenerateReport = async () => {
    if (!user || !selectedChildId) return;

    try {
      setGenerating(true);
      const reportData = await parentApi.generateReport(user.userId, selectedChildId, {
        startDate,
        endDate,
        subjects: selectedSubjects.length > 0 ? selectedSubjects.join(',') : undefined,
        includeComparison,
      });
      setReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    // Open print dialog
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${selectedChildId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailReport = async () => {
    if (!user || !report) return;

    // In a real app, you would send this to a backend endpoint
    alert('Email functionality would send the report to: ' + user.email);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-white rounded-xl animate-pulse" />
            <div className="lg:col-span-2 h-96 bg-white rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Children Linked</h2>
          <p className="text-gray-600 mb-6">You need to link a child before generating reports.</p>
          <button
            onClick={() => router.push('/parent/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(c => c.childId === selectedChildId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Progress Reports</h1>
          <p className="text-gray-600">Generate comprehensive performance reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 space-y-6 h-fit"
          >
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Report Options</h3>
            </div>

            {/* Child Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Child
              </label>
              <ChildSelector
                children={children}
                selectedChildId={selectedChildId}
                onSelectChild={setSelectedChildId}
                loading={false}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Subject Filter */}
            {availableSubjects.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Subjects
                </label>
                <div className="space-y-2">
                  {availableSubjects.map(subject => (
                    <label key={subject} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
                {selectedSubjects.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">All subjects will be included</p>
                )}
              </div>
            )}

            {/* Options */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Include class comparison</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={generating || !selectedChildId}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              <FileText className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </motion.div>

          {/* Report Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl p-8 min-h-[600px]"
            id="report-content"
          >
            {!report ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Report Generated</h3>
                  <p className="text-gray-600">
                    Configure your report options and click "Generate Report"
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 print:text-black">
                {/* Report Header */}
                <div className="border-b-2 border-gray-200 pb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Progress Report: {selectedChild?.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Key Statistics */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">Quizzes</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{report.statistics.totalQuizzes}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">Avg Score</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{report.statistics.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">Time Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(report.statistics.timeSpent / 60)}m</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{report.statistics.streak} days</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{report.summary}</p>
                </div>

                {/* Subject Breakdown */}
                {report.statistics.subjectBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Subject Performance</h3>
                    <div className="space-y-3">
                      {report.statistics.subjectBreakdown.map(subject => {
                        const percentage = subject.averagePercentage;
                        let colorClass = 'bg-red-500';
                        if (percentage >= 80) colorClass = 'bg-green-500';
                        else if (percentage >= 70) colorClass = 'bg-blue-500';
                        else if (percentage >= 60) colorClass = 'bg-yellow-500';

                        return (
                          <div key={subject.subject} className="border-2 border-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">{subject.subject}</span>
                              <span className="text-sm text-gray-600">{subject.quizzesTaken} quizzes</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                              <div
                                className={`h-full ${colorClass}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Average: {percentage.toFixed(1)}%</span>
                              <span className="text-gray-600">Total Points: {subject.totalScore}/{subject.totalPossible}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {report.alerts && report.alerts.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Areas of Attention</h3>
                    <div className="space-y-3">
                      {report.alerts.map((alert, index) => {
                        let bgColor = 'bg-yellow-50';
                        let textColor = 'text-yellow-600';
                        let borderColor = 'border-yellow-200';

                        if (alert.severity === 'high') {
                          bgColor = 'bg-red-50';
                          textColor = 'text-red-600';
                          borderColor = 'border-red-200';
                        } else if (alert.severity === 'low') {
                          bgColor = 'bg-orange-50';
                          textColor = 'text-orange-600';
                          borderColor = 'border-orange-200';
                        }

                        return (
                          <div key={index} className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 flex items-start gap-3`}>
                            <AlertCircle className={`w-5 h-5 ${textColor} mt-0.5 flex-shrink-0`} />
                            <div>
                              <p className={`font-semibold ${textColor} mb-1`}>
                                {alert.type.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-gray-700 text-sm">{alert.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t-2 border-gray-200 print:hidden">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Print / Save as PDF
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-500 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Download JSON
                  </button>
                  <button
                    onClick={handleEmailReport}
                    className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-500 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Mail className="w-5 h-5" />
                    Email Report
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-black {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
