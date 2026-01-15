'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  avatarUrl?: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-400';
    if (rank === 2) return 'bg-gray-100 border-gray-400';
    if (rank === 3) return 'bg-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏆</span>
        <h3 className="text-xl font-bold text-gray-900">Leaderboard</h3>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.userId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${getRankColor(entry.rank)}
                ${entry.userId === currentUserId ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Rank with Medal */}
                <div className="flex items-center justify-center w-10">
                  {getMedalEmoji(entry.rank) ? (
                    <span className="text-3xl">{getMedalEmoji(entry.rank)}</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-600">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.userName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {entry.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {entry.userName}
                    {entry.userId === currentUserId && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <motion.div
                  key={entry.score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-right"
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No participants yet</p>
            <p className="text-sm mt-2">Scores will appear as students answer</p>
          </div>
        )}
      </div>
    </div>
  );
}
