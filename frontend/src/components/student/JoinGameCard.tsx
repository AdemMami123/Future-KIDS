'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowRight } from 'lucide-react';
import { studentApi } from '@/lib/studentApi';
import { useAuth } from '@/contexts/AuthContext';

export default function JoinGameCard() {
  const router = useRouter();
  const { user } = useAuth();
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !gameCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Redirect to join page with the game code - let Socket.io handle the actual joining
      router.push(`/student/join?code=${gameCode.trim()}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Game not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Join Live Game</h2>
          <p className="text-purple-100">Enter a game code to play</p>
        </div>
      </div>

      <form onSubmit={handleJoinGame} className="space-y-4">
        <div>
          <input
            type="text"
            value={gameCode}
            onChange={(e) => {
              setGameCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-6 py-4 bg-white/90 text-gray-900 rounded-xl text-center text-3xl font-bold tracking-widest placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-red-200 text-sm"
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={gameCode.length !== 6 || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              Joining...
            </>
          ) : (
            <>
              Join Game
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
        <p className="text-sm text-purple-100">
          💡 <strong>Tip:</strong> Get the game code from your teacher's screen
        </p>
      </div>
    </motion.div>
  );
}
