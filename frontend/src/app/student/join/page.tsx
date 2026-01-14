'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket } from '@/hooks/useSocket';
import {
  RocketLaunchIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

export default function JoinGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { joinGame, on, off, isConnected } = useGameSocket();

  const [gameCode, setGameCode] = useState(searchParams?.get('code') || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isInLobby, setIsInLobby] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Listen for lobby events
    const handleParticipantJoined = (data: { participant: Participant; participantCount: number }) => {
      setParticipants((prev) => {
        // Avoid duplicates
        const exists = prev.some((p) => p.userId === data.participant.userId);
        if (exists) return prev;
        return [...prev, data.participant];
      });
    };

    const handleParticipantLeft = (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    };

    const handleGameStarted = () => {
      if (sessionId) {
        router.push(`/student/games/${sessionId}/play`);
      }
    };

    const handleParticipantKicked = (data: { userId: string }) => {
      if (data.userId === user?.userId) {
        setError('You have been removed from the game');
        setIsInLobby(false);
        setSessionId(null);
      }
    };

    on('participant-joined', handleParticipantJoined);
    on('participant-left', handleParticipantLeft);
    on('game-started', handleGameStarted);
    on('participant-kicked', handleParticipantKicked);

    return () => {
      off('participant-joined', handleParticipantJoined);
      off('participant-left', handleParticipantLeft);
      off('game-started', handleGameStarted);
      off('participant-kicked', handleParticipantKicked);
    };
  }, [user, sessionId, on, off, router]);

  const handleJoinGame = () => {
    if (!gameCode || gameCode.length !== 6) {
      setError('Please enter a valid 6-digit game code');
      return;
    }

    if (!user?.userId) {
      setError('You must be logged in to join a game');
      return;
    }

    setJoining(true);
    setError('');

    joinGame(
      { gameCode, userId: user.userId },
      (response) => {
        setJoining(false);

        if (response.success && response.session) {
          setSessionId(response.session.sessionId);
          setParticipants(response.session.participants || []);
          setIsInLobby(true);
        } else {
          setError(response.error || 'Failed to join game');
        }
      }
    );
  };

  const handleCodeInput = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setGameCode(cleaned);
    setError('');
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (gameCode.length === 6 && !isInLobby) {
      handleJoinGame();
    }
  }, [gameCode]);

  if (isInLobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Waiting Screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <ClockIcon className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              You're In!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Waiting for the teacher to start the game...
            </p>

            {/* Participants Count */}
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-blue-50 rounded-full mb-8">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">
                {participants.length} {participants.length === 1 ? 'player' : 'players'} in lobby
              </span>
            </div>

            {/* Participants Grid */}
            {participants.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Players</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {participants.map((participant, index) => (
                      <motion.div
                        key={participant.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col items-center p-4 bg-gray-50 rounded-xl"
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold mb-2 ${
                          participant.userId === user?.userId
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 ring-4 ring-green-200'
                            : 'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                          {participant.userName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                          {participant.userName}
                          {participant.userId === user?.userId && (
                            <span className="block text-xs text-green-600">(You)</span>
                          )}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Loading Animation */}
            <div className="mt-8 flex items-center justify-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-3 h-3 bg-blue-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-3 h-3 bg-purple-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-3 h-3 bg-pink-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl mb-6"
          >
            <RocketLaunchIcon className="w-12 h-12 text-purple-600" />
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-2">Join Game</h1>
          <p className="text-xl text-white/90">
            Enter the 6-digit game code
          </p>
        </div>

        {/* Game Code Input */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <input
              type="text"
              value={gameCode}
              onChange={(e) => handleCodeInput(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full text-6xl font-bold text-center tracking-widest text-gray-900 bg-gray-50 rounded-2xl py-6 focus:outline-none focus:ring-4 focus:ring-purple-500 transition-all"
              autoFocus
            />
          </div>

          {/* Connection Status */}
          <div className="mb-6 flex items-center justify-center space-x-2">
            {isConnected ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-600 font-medium">Connecting...</span>
              </>
            )}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-red-700 text-center font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Button */}
          <button
            onClick={handleJoinGame}
            disabled={gameCode.length !== 6 || joining || !isConnected}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {joining ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining...</span>
              </span>
            ) : (
              'Join Game'
            )}
          </button>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Ask your teacher for the game code or check the screen in your classroom
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="text-white/90 hover:text-white font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
