'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket } from '@/hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import GameTimer from '@/components/game/GameTimer';
import Leaderboard from '@/components/game/Leaderboard';

interface Participant {
  userId: string;
  userName: string;
  score: number;
  avatarUrl?: string;
  hasAnswered?: boolean;
}

export default function TeacherGamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const socket = useGameSocket();

  const sessionId = params.sessionId as string;

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (!user?.userId) return;

    socket.nextQuestion?.(
      { sessionId, teacherId: user.userId },
      (response) => {
        if (response.success && response.question) {
          setCurrentQuestion(response.question);
          setQuestionIndex(response.questionIndex || 0);
          // Reset answered status
          setParticipants((prev) =>
            prev.map((p) => ({ ...p, hasAnswered: false }))
          );
        } else {
          console.error('Failed to advance question:', response.error);
          if (response.error === 'No more questions') {
            handleEndGame();
          }
        }
      }
    );
  }, [user, sessionId, socket]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (!user?.userId) return;

    socket.pauseGame?.({ sessionId, teacherId: user.userId }, (response) => {
      if (response.success) {
        setIsPaused(true);
      }
    });
  }, [user, sessionId, socket]);

  const handleResume = useCallback(() => {
    if (!user?.userId) return;

    socket.resumeGame?.({ sessionId, teacherId: user.userId }, (response) => {
      if (response.success) {
        setIsPaused(false);
      }
    });
  }, [user, sessionId, socket]);

  // Handle end game
  const handleEndGame = useCallback(() => {
    if (!user?.userId) return;

    if (confirm('Are you sure you want to end the game?')) {
      socket.endGame?.({ sessionId, teacherId: user.userId }, (response) => {
        if (response.success && response.results) {
          // Store results in sessionStorage for immediate access
          sessionStorage.setItem(
            `game-results-${sessionId}`,
            JSON.stringify(response.results)
          );
          router.push(`/teacher/games/${sessionId}/results`);
        } else if (response.success) {
          router.push(`/teacher/games/${sessionId}/results`);
        }
      });
    }
  }, [user, sessionId, socket, router]);

  // Handle question timeout
  const handleTimeUp = useCallback(() => {
    console.log('Time is up for this question!');
    socket.questionTimeout?.({ sessionId }, (response) => {
      if (response.success) {
        // Show brief message before moving to next
        setTimeout(() => {
          handleNextQuestion();
        }, 2000);
      }
    });
  }, [sessionId, socket, handleNextQuestion]);

  // Socket event listeners
  useEffect(() => {
    if (!socket.socket) return;

    // Question started event
    socket.on?.('question-started', (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, hasAnswered: false }))
      );
    });

    // Answer submitted
    socket.on?.('answer-submitted', (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, hasAnswered: true } : p
        )
      );
    });

    // Leaderboard updated
    socket.on?.('leaderboard-updated', (data: any) => {
      setLeaderboard(data.leaderboard);
      // Update participant scores
      setParticipants((prev) =>
        prev.map((p) => {
          const lb = data.leaderboard.find((l: any) => l.userId === p.userId);
          return lb ? { ...p, score: lb.score } : p;
        })
      );
    });

    // Game paused/resumed
    socket.on?.('game-paused', () => setIsPaused(true));
    socket.on?.('game-resumed', () => setIsPaused(false));

    // Participant joined/left
    socket.on?.('participant-joined', (data: any) => {
      setParticipants((prev) => [
        ...prev,
        {
          userId: data.userId,
          userName: data.userName,
          score: 0,
          avatarUrl: data.avatarUrl,
          hasAnswered: false,
        },
      ]);
    });

    socket.on?.('participant-left', (data: any) => {
      setParticipants((prev) =>
        prev.filter((p) => p.userId !== data.userId)
      );
    });

    return () => {
      socket.off?.('question-started');
      socket.off?.('answer-submitted');
      socket.off?.('leaderboard-updated');
      socket.off?.('game-paused');
      socket.off?.('game-resumed');
      socket.off?.('participant-joined');
      socket.off?.('participant-left');
    };
  }, [socket]);

  // Initial load - rejoin session to receive events
  useEffect(() => {
    if (socket.isConnected && user?.userId && sessionId) {
      // Rejoin the session socket room
      socket.rejoinSession?.(
        { sessionId, userId: user.userId },
        (response) => {
          if (response.success) {
            console.log('✅ Teacher rejoined game session');
            // Set initial data from session
            if (response.session?.participants) {
              setParticipants(response.session.participants.map((p: any) => ({
                ...p,
                score: p.score || 0,
                hasAnswered: false
              })));
            }
            
            // Also fetch current question
            socket.getCurrentQuestion?.(
              { sessionId },
              (questionResponse) => {
                if (questionResponse.success && questionResponse.question) {
                  console.log('📝 Got current question:', questionResponse.question);
                  setCurrentQuestion(questionResponse.question);
                  setQuestionIndex(questionResponse.question.questionIndex || 0);
                  setTotalQuestions(questionResponse.question.totalQuestions || 0);
                }
              }
            );
          } else {
            console.error('Failed to rejoin session:', response.error);
          }
          setLoading(false);
        }
      );
    }
  }, [socket.isConnected, user, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Live Game Control
              </h1>
              <p className="text-gray-600">
                Question {questionIndex + 1} of {totalQuestions}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {isPaused ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResume}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <span>▶️</span>
                  Resume
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
                >
                  <span>⏸️</span>
                  Pause
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEndGame}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                End Game
              </motion.button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <GameTimer
              duration={timePerQuestion}
              onTimeUp={handleTimeUp}
              isPaused={isPaused}
            />

            {/* Question */}
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <QuestionDisplay
                  key={currentQuestion.questionId}
                  question={currentQuestion}
                  questionIndex={questionIndex}
                  totalQuestions={totalQuestions}
                />
              )}
            </AnimatePresence>

            {/* Answer Options Display (for teacher reference) */}
            {currentQuestion?.options && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Answer Options
                </h3>
                <div className="grid gap-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="font-medium text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${participant.hasAnswered ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                        w-3 h-3 rounded-full
                        ${participant.hasAnswered ? 'bg-green-500' : 'bg-gray-300'}
                      `}
                      />
                      <span className="text-sm font-medium truncate">
                        {participant.userName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Question Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextQuestion}
              disabled={isPaused}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Next Question →
            </motion.button>
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard entries={leaderboard} />
          </div>
        </div>
      </div>
    </div>
  );
}
