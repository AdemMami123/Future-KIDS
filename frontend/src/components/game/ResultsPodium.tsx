'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  correctAnswers: number;
  totalAnswers: number;
}

interface ResultsPodiumProps {
  participants: Participant[];
}

export default function ResultsPodium({ participants }: ResultsPodiumProps) {
  const top3 = participants.slice(0, 3);
  
  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3 
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2 
      ? [top3[1], top3[0]]
      : top3;

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1: return 'h-32';
      case 2: return 'h-24';
      case 3: return 'h-16';
      default: return 'h-16';
    }
  };

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-t from-yellow-500 to-yellow-300';
      case 2: return 'bg-gradient-to-t from-gray-400 to-gray-300';
      case 3: return 'bg-gradient-to-t from-orange-600 to-orange-400';
      default: return 'bg-gray-300';
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No participants yet
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {podiumOrder.map((participant, index) => (
        <motion.div
          key={participant.userId}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2, duration: 0.5, type: 'spring' }}
          className="flex flex-col items-center"
        >
          {/* Avatar and Medal */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.2 + 0.3, type: 'spring', stiffness: 200 }}
            className="relative mb-2"
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-4 ${
              participant.rank === 1 ? 'border-yellow-400' :
              participant.rank === 2 ? 'border-gray-300' :
              'border-orange-400'
            } shadow-lg`}>
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(participant.userName)}
                </div>
              )}
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.2 + 0.5, type: 'spring' }}
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg"
            >
              {getMedalIcon(participant.rank)}
            </motion.div>
          </motion.div>

          {/* Name and Score */}
          <div className="text-center mb-2">
            <p className="font-semibold text-gray-800 text-sm truncate max-w-[100px]">
              {participant.userName}
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.2 + 0.6 }}
              className="text-lg font-bold text-purple-600"
            >
              {participant.score.toLocaleString()} pts
            </motion.p>
          </div>

          {/* Podium */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.2 + 0.4, duration: 0.4 }}
            className={`w-24 ${getPodiumHeight(participant.rank)} ${getPodiumColor(participant.rank)} rounded-t-lg flex items-center justify-center shadow-lg`}
          >
            <span className="text-white font-bold text-2xl">
              {participant.rank}
            </span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
