'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket } from '@/hooks/useSocket';
import {
  UserGroupIcon,
  LinkIcon,
  QrCodeIcon,
  PlayIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: any;
}

interface GameSession {
  sessionId: string;
  quizId: string;
  teacherId: string;
  classId: string;
  gameCode: string;
  status: string;
  participants: Participant[];
  settings: {
    showAnswers: boolean;
    showLeaderboard: boolean;
  };
}

export default function GameLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { on, off, startGame, kickParticipant, isConnected } = useGameSocket();

  const sessionId = params?.sessionId as string;
  const [session, setSession] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // Fetch initial session data
    fetchSessionData();

    // Listen for participant events
    const handleParticipantJoined = (data: { participant: Participant; participantCount: number }) => {
      setParticipants((prev) => [...prev, data.participant]);
    };

    const handleParticipantLeft = (data: { userId: string; participantCount: number }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    };

    const handleGameStarted = () => {
      router.push(`/teacher/games/${sessionId}/play`);
    };

    on('participant-joined', handleParticipantJoined);
    on('participant-left', handleParticipantLeft);
    on('game-started', handleGameStarted);

    return () => {
      off('participant-joined', handleParticipantJoined);
      off('participant-left', handleParticipantLeft);
      off('game-started', handleGameStarted);
    };
  }, [sessionId, on, off, router]);

  const fetchSessionData = async () => {
    try {
      // TODO: Add API endpoint to fetch session data
      // For now, we'll rely on Socket.io events
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  };

  const handleStartGame = () => {
    if (participants.length === 0) {
      alert('Cannot start game with no participants');
      return;
    }

    setStarting(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          proceedToStartGame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const proceedToStartGame = () => {
    if (!user?.userId) return;

    startGame(
      { sessionId, teacherId: user.userId },
      (response) => {
        setStarting(false);
        if (!response.success) {
          alert(response.error || 'Failed to start game');
        }
      }
    );
  };

  const handleKickParticipant = (userId: string) => {
    if (!user?.userId) return;

    if (confirm('Are you sure you want to remove this participant?')) {
      kickParticipant({ sessionId, userId, teacherId: user.userId });
    }
  };

  const copyGameCode = () => {
    if (session?.gameCode) {
      navigator.clipboard.writeText(session.gameCode);
      alert('Game code copied to clipboard!');
    }
  };

  const shareLink = () => {
    const link = `${window.location.origin}/student/join?code=${session?.gameCode}`;
    navigator.clipboard.writeText(link);
    alert('Join link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Game Code */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Game Lobby</h1>
          <div className="bg-white rounded-2xl shadow-2xl p-8 inline-block">
            <p className="text-gray-600 mb-2">Game Code</p>
            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wider mb-4">
              {session?.gameCode || '------'}
            </div>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={copyGameCode}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                <span>Copy Code</span>
              </button>
              <button
                onClick={shareLink}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <QrCodeIcon className="w-5 h-5" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participants List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Participants ({participants.length})
                </h2>
              </div>
              {!isConnected && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Connecting...
                </span>
              )}
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Waiting for students...
                </h3>
                <p className="text-gray-600">
                  Students will appear here once they join with the game code
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.userId}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {participant.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {participant.userName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(participant.joinedAt?.toDate?.() || Date.now()).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleKickParticipant(participant.userId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove participant"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Start Game Button */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ready to Start?
              </h3>
              <button
                onClick={handleStartGame}
                disabled={participants.length === 0 || starting || !isConnected}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
              >
                <PlayIcon className="w-6 h-6" />
                <span>Start Game</span>
              </button>
              {participants.length === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Waiting for at least one participant
                </p>
              )}
            </div>

            {/* Game Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Game Settings
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Show Answers:</span>
                  <span className="font-medium text-gray-900">
                    {session?.settings.showAnswers ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Show Leaderboard:</span>
                  <span className="font-medium text-gray-900">
                    {session?.settings.showLeaderboard ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
            >
              Cancel Game
            </button>
          </motion.div>
        </div>

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-9xl font-bold text-white mb-4"
                >
                  {countdown}
                </motion.div>
                <p className="text-2xl text-white">Get ready!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
