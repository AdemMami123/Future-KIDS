'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket } from '@/hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import AnswerOptions from '@/components/game/AnswerOptions';
import GameTimer from '@/components/game/GameTimer';

export default function StudentGamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const socket = useGameSocket();

  const sessionId = params.sessionId as string;

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Rejoin session on mount and fetch current question
  useEffect(() => {
    if (socket.isConnected && user?.userId && sessionId) {
      console.log('🔄 Rejoining game session and fetching current question...');
      socket.rejoinSession?.(
        { sessionId, userId: user.userId },
        (response) => {
          if (response.success) {
            console.log('✅ Student rejoined game session');
            // Request current question from server
            socket.getCurrentQuestion?.(
              { sessionId },
              (questionResponse) => {
                if (questionResponse.success && questionResponse.question) {
                  console.log('📝 Got current question:', questionResponse.question);
                  setCurrentQuestion(questionResponse.question);
                  setQuestionIndex(questionResponse.question.questionIndex || 0);
                  setTotalQuestions(questionResponse.question.totalQuestions || 0);
                  setQuestionStartTime(Date.now());
                } else {
                  console.log('⏳ No question available yet, waiting for teacher...');
                }
              }
            );
          } else {
            console.error('Failed to rejoin session:', response.error);
          }
        }
      );
    }
  }, [socket.isConnected, user, sessionId]);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // Submit answer
  const handleSubmitAnswer = useCallback(() => {
    if (!user?.userId || !currentQuestion || !selectedAnswer || hasSubmitted) {
      console.log('❌ Cannot submit - missing data:', { hasUser: !!user?.userId, hasQuestion: !!currentQuestion, hasAnswer: !!selectedAnswer, hasSubmitted });
      return;
    }

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const userName = `${user.firstName} ${user.lastName}`;
    console.log('📝 Submitting answer:', { sessionId, userId: user.userId, userName, questionId: currentQuestion.questionId, answer: selectedAnswer, timeSpent });

    socket.submitAnswer?.(
      {
        sessionId,
        userId: user.userId,
        userName, // Include userName for recovery if participant not found
        questionId: currentQuestion.questionId,
        answer: selectedAnswer,
        timeSpent,
      },
      (response) => {
        console.log('📨 Submit response:', response);
        if (response.success) {
          setHasSubmitted(true);
          setWaitingForNext(true);

          // Update total score
          if (response.isCorrect) {
            setScore((prev) => prev + (response.points || 0));
          }
        } else {
          console.error('Failed to submit answer:', response.error);
        }
      }
    );
  }, [
    user,
    currentQuestion,
    selectedAnswer,
    hasSubmitted,
    sessionId,
    socket,
    questionStartTime,
  ]);

  // Handle answer selection
  const handleSelectAnswer = useCallback((answer: string | number) => {
    if (!hasSubmitted) {
      setSelectedAnswer(answer);
    }
  }, [hasSubmitted]);

  // Socket event listeners
  useEffect(() => {
    if (!socket.socket) return;

    // New question started
    socket.on?.('question-started', (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setWaitingForNext(false);
      setQuestionStartTime(Date.now());
    });

    // Game paused/resumed
    socket.on?.('game-paused', () => setIsPaused(true));
    socket.on?.('game-resumed', () => setIsPaused(false));

    // Question timed out
    socket.on?.('question-timed-out', () => {
      if (!hasSubmitted) {
        setWaitingForNext(true);
      }
    });

    // Game ended - store results and redirect
    socket.on?.('game-ended', (data: any) => {
      // Store leaderboard data for immediate display
      if (data.leaderboard) {
        sessionStorage.setItem(
          `game-results-${sessionId}`,
          JSON.stringify(data)
        );
      }
      router.push(`/student/games/${sessionId}/results`);
    });

    return () => {
      socket.off?.('question-started');
      socket.off?.('game-paused');
      socket.off?.('game-resumed');
      socket.off?.('question-timed-out');
      socket.off?.('game-ended');
    };
  }, [socket, sessionId, router, hasSubmitted]);

  // Auto-submit when time is up
  const handleTimeUp = useCallback(() => {
    if (!hasSubmitted && selectedAnswer) {
      handleSubmitAnswer();
    } else if (!hasSubmitted) {
      setWaitingForNext(true);
    }
  }, [hasSubmitted, selectedAnswer, handleSubmitAnswer]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center"
        >
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Waiting for next question...
          </h2>
          <p className="text-gray-600">Get ready!</p>
        </motion.div>
      </div>
    );
  }

  if (waitingForNext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Answer Submitted!
          </h2>
          <div className="bg-blue-100 rounded-2xl p-6 mb-4">
            <p className="text-sm text-gray-600 mb-2">Your Score</p>
            <p className="text-5xl font-bold text-blue-600">{score}</p>
          </div>
          <p className="text-gray-600">Waiting for next question...</p>
          <div className="mt-6">
            <div className="animate-pulse flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animation-delay-200"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animation-delay-400"></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with Score */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm opacity-90">Your Score</p>
                <motion.p
                  key={score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold"
                >
                  {score}
                </motion.p>
              </div>

              <div className="text-white text-right">
                <p className="text-sm opacity-90">Question</p>
                <p className="text-2xl font-bold">
                  {questionIndex + 1} / {totalQuestions}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Timer */}
          <div className="mb-6">
            <GameTimer
              duration={timePerQuestion}
              onTimeUp={handleTimeUp}
              isPaused={isPaused}
            />
          </div>

          {/* Question */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              <QuestionDisplay
                key={currentQuestion.questionId}
                question={currentQuestion}
                questionIndex={questionIndex}
                totalQuestions={totalQuestions}
              />
            </AnimatePresence>
          </div>

          {/* Answer Options */}
          <div className="mb-6">
            {currentQuestion.type === 'multiple-choice' && (
              <AnswerOptions
                options={currentQuestion.options}
                selectedAnswer={selectedAnswer}
                onSelect={handleSelectAnswer}
                disabled={hasSubmitted || isPaused}
              />
            )}

            {currentQuestion.type === 'true-false' && (
              <AnswerOptions
                options={['True', 'False']}
                selectedAnswer={selectedAnswer}
                onSelect={handleSelectAnswer}
                disabled={hasSubmitted || isPaused}
              />
            )}

            {currentQuestion.type === 'short-answer' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <input
                  type="text"
                  value={selectedAnswer as string || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={hasSubmitted || isPaused}
                  placeholder="Type your answer..."
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          {!hasSubmitted && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || isPaused}
              className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
            >
              {selectedAnswer ? 'Submit Answer 🚀' : 'Select an answer first'}
            </motion.button>
          )}

          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-6"
            >
              <div className="bg-yellow-500 text-white px-6 py-3 rounded-full inline-block font-semibold">
                ⏸️ Game Paused
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
