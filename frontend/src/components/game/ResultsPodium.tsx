'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PodiumParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  score: number;
  correctAnswers: number;
  rank: number;
}

interface ResultsPodiumProps {
  participants: PodiumParticipant[];
}

export default function ResultsPodium({ participants }: ResultsPodiumProps) {
  // Get top 3
  const top3 = participants.slice(0, 3);
  
  // Arrange for podium: 2nd, 1st, 3rd
  const podiumOrder = [
    top3[1], // 2nd place - left
    top3[0], // 1st place - center
    top3[2], // 3rd place - right
  ].filter(Boolean);

  const podiumHeights = ['h-48', 'h-64', 'h-40'];
  const podiumColors = [
    'bg-gradient-to-b from-gray-300 to-gray-400',
    'bg-gradient-to-b from-yellow-300 to-yellow-500',
    'bg-gradient-to-b from-orange-300 to-orange-400',
  ];
  const medals = ['🥈', '🥇', '🥉'];
  const ranks = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {podiumOrder.map((participant, index) => {
        if (!participant) return null;

        return (
          <motion.div
            key={participant.userId}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.2, type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Participant card */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 + 0.3, type: 'spring' }}
              className="mb-4 text-center"
            >
              {/* Medal */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  delay: index * 0.2 + 0.5,
                  duration: 0.5,
                }}
                className="text-5xl mb-2"
              >
                {medals[index]}
              </motion.div>

              {/* Avatar */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                {participant.avatarUrl ? (
                  <Image
                    src={participant.avatarUrl}
                    alt={participant.userName}
                    fill
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                    {participant.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="font-bold text-lg text-gray-800 mb-1">
                {participant.userName}
              </div>

              {/* Score */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.2 + 0.7, type: 'spring' }}
                className="bg-white rounded-lg px-4 py-2 shadow-md"
              >
                <div className="text-2xl font-bold text-purple-600">
                  {participant.score}
                </div>
                <div className="text-xs text-gray-500">
                  {participant.correctAnswers} correct
                </div>
              </motion.div>
            </motion.div>

            {/* Podium */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className={`w-32 ${podiumHeights[index]} ${podiumColors[index]} rounded-t-lg shadow-lg flex items-center justify-center origin-bottom`}
            >
              <div className="text-white text-4xl font-bold">{ranks[index]}</div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
