'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from 'lucide-react';

interface ShareResultsProps {
  title: string;
  score: number;
  rank?: number;
  totalParticipants?: number;
  quizTitle: string;
}

export default function ShareResults({
  title,
  score,
  rank,
  totalParticipants,
  quizTitle,
}: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareText = rank
    ? `🎉 I scored ${score} points and ranked #${rank} out of ${totalParticipants} in "${quizTitle}"!`
    : `🎉 I scored ${score} points in "${quizTitle}"!`;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    let shareLink = '';
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: quizTitle,
              text: shareText,
              url: shareUrl,
            });
          } catch (err) {
            console.error('Share failed:', err);
          }
        }
        return;
      default:
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
      >
        <Share2 className="w-4 h-4" />
        Share Results
      </motion.button>

      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
          >
            <div className="p-3 border-b bg-gray-50">
              <p className="text-sm text-gray-600 font-medium">Share your achievement!</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => handleShare('native')}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">Share</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">Twitter / X</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">Facebook</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Link2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
