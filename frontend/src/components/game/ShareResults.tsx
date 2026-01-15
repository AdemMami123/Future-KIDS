'use client';

import React, { useState } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { gameResultsApi } from '@/lib/gameResultsApi';

interface ShareResultsProps {
  sessionId: string;
  quizTitle: string;
  score: number;
  rank: number;
  totalParticipants: number;
}

export default function ShareResults({
  sessionId,
  quizTitle,
  score,
  rank,
  totalParticipants,
}: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareText = `I scored ${score} points and ranked #${rank} out of ${totalParticipants} in "${quizTitle}"! 🎉`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quiz Results',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      const { data, filename } = await gameResultsApi.exportResults(
        sessionId,
        'csv'
      );

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Share Results
      </h3>

      <div className="space-y-3">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share Results
        </button>

        {/* Copy Text Button */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Text
            </>
          )}
        </button>

        {/* Download CSV Button */}
        <button
          onClick={handleDownloadCSV}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {downloading ? 'Downloading...' : 'Download CSV'}
        </button>
      </div>

      {/* Share Preview */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 italic">{shareText}</p>
      </div>
    </div>
  );
}
