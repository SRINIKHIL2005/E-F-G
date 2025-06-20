import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import DocumentUploader from '@/components/quiz/DocumentUploader';
import { io, Socket } from 'socket.io-client';
import { 
  Zap, 
  Trophy, 
  Clock, 
  Star, 
  Target, 
  Brain, 
  Sword,
  Shield,
  Crown,
  Flame,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Medal,
  TrendingUp,
  Gamepad2,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  points: number;
  timeLimit: number;
}

interface QuizSession {
  id: string;
  mode: 'classic' | 'speed' | 'survival' | 'multiplayer';
  category: string;
  difficulty: string;
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  lives: number;
  timeRemaining: number;
  streak: number;
  powerUps: PowerUp[];
  startTime: Date;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'time_freeze' | 'fifty_fifty' | 'extra_life' | 'double_points' | 'hint';
  cost: number;
  available: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  category: string;
  completedAt: Date;
  avatar?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AIQuizArena: React.FC = () => {
  const { user, token } = useAuth();
  
  // Quiz state management
  const [gameMode, setGameMode] = useState<'menu' | 'playing' | 'results'>('menu');
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<string>('classic');
  
  // Store question details for tracking and anti-repetition
  const [questionAnswers, setQuestionAnswers] = useState<Array<{
    questionId: string;
    question: string;
    category: string;
    difficulty: string;
    wasCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
  }>>([]);
  
  const [activePowerUps, setActivePowerUps] = useState<{
    doublePoints: boolean;
    fiftyFifty: boolean;
    usedFiftyFiftyQuestions: Set<string>;
  }>({
    doublePoints: false,
    fiftyFifty: false,
    usedFiftyFiftyQuestions: new Set()
  });

  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    coins: 100,
    totalQuizzes: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Multiplayer state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [multiplayerData, setMultiplayerData] = useState<any>(null);
  const [multiplayerState, setMultiplayerState] = useState<{
    inQueue: boolean;
    gameFound: boolean;
    roomId: string | null;
    opponent: { name: string; id: string } | null;
    gameStarted: boolean;
    opponentScore: number;
    opponentAnswered: boolean;
  }>({
    inQueue: false,
    gameFound: false,
    roomId: null,
    opponent: null,
    gameStarted: false,
    opponentScore: 0,
    opponentAnswered: false
  });

  const categories = [
    { id: 'javascript', name: 'JavaScript Mastery', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'react', name: 'React Kingdom', icon: '⚛️', color: 'from-blue-400 to-cyan-500' },
    { id: 'algorithms', name: 'Algorithm Arena', icon: '🧮', color: 'from-purple-400 to-pink-500' },
    { id: 'databases', name: 'Database Dungeon', icon: '🗄️', color: 'from-green-400 to-emerald-500' },
    { id: 'security', name: 'Cyber Fortress', icon: '🛡️', color: 'from-red-400 to-rose-500' },
    { id: 'ai', name: 'AI Universe', icon: '🤖', color: 'from-indigo-400 to-purple-500' }
  ];

  const gameModes = [
    {
      id: 'classic',
      name: 'Classic Quest',
      description: '10 questions, unlimited time',
      icon: <Brain className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'speed',
      name: 'Lightning Round',
      description: '20 questions, 30 seconds each',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'survival',
      name: 'Survival Mode',
      description: 'Unlimited questions, 3 lives',
      icon: <Shield className="h-6 w-6" />,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'multiplayer',
      name: 'Battle Arena',
      description: 'Compete with others live',
      icon: <Sword className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  // Sound system with actual audio feedback
  const playSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    
    try {
      // Create audio context for better browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Define sound frequencies and durations for different types
      const soundMap: { [key: string]: { frequency: number; duration: number; type: OscillatorType } } = {
        'correct': { frequency: 800, duration: 0.3, type: 'sine' },
        'wrong': { frequency: 300, duration: 0.5, type: 'sawtooth' },
        'game-start': { frequency: 440, duration: 0.2, type: 'square' },
        'game-end': { frequency: 330, duration: 0.8, type: 'sine' },
        'power-up': { frequency: 1000, duration: 0.15, type: 'sine' },
        'tick': { frequency: 600, duration: 0.1, type: 'square' },
        'countdown': { frequency: 500, duration: 0.2, type: 'triangle' }
      };
      
      const sound = soundMap[type] || soundMap['tick'];
      
      // Create oscillator and gain node
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
      oscillator.type = sound.type;
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + sound.duration);
      
    } catch (error) {
      // Fallback: just log if audio context fails
      console.log(`Playing sound: ${type}`);
    }
  }, [soundEnabled]);

  // Initialize component
  useEffect(() => {
    initializePowerUps();
    loadAchievements();
    loadLeaderboard();
    loadPlayerStats();
  }, []);

  // Timer management
  useEffect(() => {
    let interval: number;
    if (currentSession && timeLeft > 0 && gameMode === 'playing') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession, timeLeft, gameMode]);

  // Socket connection for multiplayer
  useEffect(() => {
    const socketIo = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token
      }
    });

    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setShowConnectionError(true);
    });

    socketIo.on('reconnect_attempt', () => {
      setShowConnectionError(false);
    });

    return () => {
      socketIo.disconnect();
    };
  }, [token]);

  // Socket event handlers for multiplayer
  useEffect(() => {
    if (!socket) return;

    socket.on('room_data', (data: any) => {
      setConnectedUsers(data.connectedUsers);
      setMultiplayerData(data);
    });

    socket.on('quiz_started', (data: any) => {
      const { questions, mode } = data;
      const session: QuizSession = {
        id: Date.now().toString(),
        mode: mode as any,
        category: 'Multiplayer',
        difficulty: 'adaptive',
        questions: questions,
        currentQuestionIndex: 0,
        score: 0,
        lives: mode === 'survival' ? 3 : 1,
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date()
      };
      setCurrentSession(session);
      setTimeLeft(session.questions[0]?.timeLimit || 30);
      setGameMode('playing');
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      // Reset active power-ups for new quiz
      setActivePowerUps({
        doublePoints: false,
        fiftyFifty: false,
        usedFiftyFiftyQuestions: new Set()
      });
      
      if (soundEnabled) {
        playSound('game-start');
      }
    });

    socket.on('quiz_ended', (data: any) => {
      const { scores } = data;
      setGameMode('results');
      setLeaderboard(scores);
      
      if (soundEnabled) {
        playSound('game-end');
      }
    });

    socket.on('queue-status', (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        inQueue: data.inQueue,
        queuePosition: data.position
      }));
    });

    socket.on('game-found', (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        gameFound: true,
        inQueue: false,
        roomId: data.roomId,
        opponent: data.opponent
      }));
      
      toast.success('Game found! Starting in 3 seconds...');
      
      setTimeout(() => {
        const session: QuizSession = {
          id: Date.now().toString(),
          mode: 'multiplayer',
          category: data.category || 'General',
          difficulty: 'adaptive',
          questions: data.questions,
          currentQuestionIndex: 0,
          score: 0,
          lives: 1,
          timeRemaining: 0,
          streak: 0,
          powerUps: [],
          startTime: new Date()
        };
        setCurrentSession(session);
        setTimeLeft(session.questions[0]?.timeLimit || 30);
        setGameMode('playing');
        setSelectedAnswer(null);
        setShowExplanation(false);
      }, 3000);
    });

    socket.on('question-results', (data: any) => {
      const { results } = data;
      const myResult = results.find((r: any) => r.playerId === user?.id);
      const opponentResult = results.find((r: any) => r.playerId !== user?.id);
      
      // Update current session score
      if (myResult && currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          score: myResult.totalScore
        } : null);
      }
      
      // Update multiplayer state with results
      setMultiplayerState(prev => ({
        ...prev,
        opponentScore: opponentResult?.totalScore || 0,
        lastQuestionResult: {
          myAnswer: myResult?.selectedAnswer,
          opponentAnswer: opponentResult?.selectedAnswer,
          correctAnswer: data.correctAnswer
        }
      }));
      
      // Show explanation after a delay
      setTimeout(() => {
        setShowExplanation(true);
      }, 1500);
    });

    socket.on('next-question', (data: any) => {
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        } : null);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setTimeLeft(data.timeLimit || 30);
        
        setMultiplayerState(prev => ({
          ...prev,
          opponentAnswered: false,
          lastQuestionResult: null
        }));
      }
    });

    socket.on('game-finished', (data: any) => {
      setGameMode('results');
      setLeaderboard(data.finalScores);
      
      if (soundEnabled) {
        playSound('game-end');
      }
      
      setMultiplayerState({
        inQueue: false,
        gameFound: false,
        roomId: null,
        opponent: null,
        gameStarted: false,
        opponentScore: 0,
        opponentAnswered: false
      });
    });

    return () => {
      socket.off('room_data');
      socket.off('quiz_started');
      socket.off('quiz_ended');
      socket.off('queue-status');
      socket.off('game-found');
      socket.off('question-results');
      socket.off('next-question');
      socket.off('game-finished');
    };
  }, [socket, soundEnabled, currentSession, user, playSound]);

  const initializePowerUps = () => {
    setPowerUps([
      {
        id: '1',
        name: 'Time Freeze',
        description: 'Stop the timer for 10 seconds',
        icon: '❄️',
        type: 'time_freeze',
        cost: 20,
        available: true
      },
      {
        id: '2',
        name: '50/50',
        description: 'Remove 2 wrong answers',
        icon: '✂️',
        type: 'fifty_fifty',
        cost: 15,
        available: true
      },
      {
        id: '3',
        name: 'Extra Life',
        description: 'Gain an additional life',
        icon: '❤️',
        type: 'extra_life',
        cost: 30,
        available: true
      },
      {
        id: '4',
        name: 'Double Points',
        description: 'Double points for next question',
        icon: '💎',
        type: 'double_points',
        cost: 25,
        available: true
      },
      {
        id: '5',
        name: 'AI Hint',
        description: 'Get a smart hint from AI',
        icon: '💡',
        type: 'hint',
        cost: 10,
        available: true
      }
    ]);
  };

  const loadAchievements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/learning-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mockAchievements: Achievement[] = [
          {
            id: '1',
            name: 'First Victory',
            description: 'Complete your first quiz',
            icon: '🏆',
            rarity: 'Common',
            unlocked: data.quizStats?.totalQuizzes > 0,
            progress: Math.min(data.quizStats?.totalQuizzes || 0, 1),
            maxProgress: 1
          },
          {
            id: '2',
            name: 'Speed Demon',
            description: 'Complete a Lightning Round',
            icon: '⚡',
            rarity: 'Rare',
            unlocked: false,
            progress: 0,
            maxProgress: 1
          },
          {
            id: '3',
            name: 'Survival Master',
            description: 'Score 100+ in Survival Mode',
            icon: '🛡️',
            rarity: 'Epic',
            unlocked: false,
            progress: 0,
            maxProgress: 100
          },
          {
            id: '4',
            name: 'Arena Champion',
            description: 'Win 10 multiplayer battles',
            icon: '👑',
            rarity: 'Legendary',
            unlocked: false,
            progress: 0,
            maxProgress: 10
          }
        ];
        setAchievements(mockAchievements);
      }
    } catch (error) {
      console.error('Failed to fetch user achievements');
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/leaderboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard');
    }
  };

  const loadPlayerStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/learning-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const quizStats = data.quizStats || {};
        setPlayerStats({
          level: quizStats.level || 1,
          xp: quizStats.xp || 0,
          coins: quizStats.coins || 100,
          totalQuizzes: quizStats.totalQuizzes || 0,
          correctAnswers: quizStats.correctAnswers || 0,
          currentStreak: quizStats.currentStreak || 0,
          bestStreak: quizStats.bestStreak || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch user quiz stats');
      setPlayerStats({
        level: 1,
        xp: 0,
        coins: 100,
        totalQuizzes: 0,
        correctAnswers: 0,
        currentStreak: 0,
        bestStreak: 0
      });
    }
  };

  const startQuiz = async (category: string, mode: string) => {
    try {
      // Show loading state
      toast.loading('🎯 Generating adaptive questions...', { id: 'quiz-loading' });
      
      // Get user's question history for better repetition avoidance
      let userQuestionHistory = [];
      try {
        const historyResponse = await fetch(`${API_BASE_URL}/api/user/question-history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          userQuestionHistory = historyData.questionHashes || [];
          console.log(`📚 Retrieved ${userQuestionHistory.length} previous questions for ${user?.name}`);
        }
      } catch (historyError) {
        console.warn('Could not fetch question history:', historyError);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-quiz-arena`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: category,
          gameMode: mode,
          difficulty: 'adaptive', // Use adaptive difficulty based on user level
          questionCount: mode === 'speed' ? 20 : mode === 'survival' ? 100 : 10,
          previousQuestions: userQuestionHistory, // Pass user's question history
          useAdaptiveDifficulty: true, // Enable adaptive difficulty
          uniqueSeed: `${user?.id}_${Date.now()}_${Math.random()}` // Unique seed for each user session
        }),
      });

      // Dismiss loading toast
      toast.dismiss('quiz-loading');

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Quiz Arena API Error:', response.status, errorData);
        throw new Error(`Failed to generate quiz: ${response.status}`);
      }

      const quizData = await response.json();
      
      // Extract questions from the correct path in API response
      const questions = quizData.quiz?.questions || quizData.questions;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid questions received from API');
      }

      // Ensure all questions have explanations
      const questionsWithExplanations = questions.map((q: any, index: number) => ({
        ...q,
        explanation: q.explanation || `The correct answer is option ${q.correctAnswer + 1}. This question tests your understanding of ${category}.`,
        id: q.id || `q_${Date.now()}_${index}`,
        timeLimit: q.timeLimit || (mode === 'speed' ? 30 : 60)
      }));
      
      const session: QuizSession = {
        id: Date.now().toString(),
        mode: mode as any,
        category,
        difficulty: 'adaptive',
        questions: questionsWithExplanations,
        currentQuestionIndex: 0,
        score: 0,
        lives: mode === 'survival' ? 3 : 1, // Ensure survival mode always gets exactly 3 lives
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date()
      };
      
      setCurrentSession(session);
      setTimeLeft(questionsWithExplanations[0]?.timeLimit || 30);
      setGameMode('playing');
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionAnswers([]); // Clear previous question tracking
      
      // Reset power-ups
      setActivePowerUps({
        doublePoints: false,
        fiftyFifty: false,
        usedFiftyFiftyQuestions: new Set()
      });
      
      if (soundEnabled) {
        playSound('game-start');
      }
      
      toast.success(`🎮 ${mode.toUpperCase()} mode started! Good luck!`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz. Please try again.');
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentSession) return;
    
    // Route to multiplayer handler if in multiplayer mode
    if (currentSession.mode === 'multiplayer' && multiplayerState.roomId) {
      handleMultiplayerAnswerSelect(answerIndex);
      return;
    }
    
    setSelectedAnswer(answerIndex);
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Record the question answer for tracking
    const questionAnswer = {
      questionId: question.id,
      question: question.question,
      category: question.category || currentSession.category,
      difficulty: question.difficulty || 'medium',
      wasCorrect: isCorrect,
      userAnswer: answerIndex,
      correctAnswer: question.correctAnswer
    };
    
    setQuestionAnswers(prev => [...prev, questionAnswer]);
    
    if (soundEnabled) {
      playSound(isCorrect ? 'correct' : 'wrong');
    }

    if (isCorrect) {
      let points = question.points;
      
      // Apply double points power-up
      if (activePowerUps.doublePoints) {
        points *= 2;
        setActivePowerUps(prev => ({
          ...prev,
          doublePoints: false
        }));
        toast.success(`Double points applied! +${points} points! 💎`);
      }
      
      const newScore = currentSession.score + points;
      const newStreak = currentSession.streak + 1;
      
      setCurrentSession(prev => prev ? {
        ...prev,
        score: newScore,
        streak: newStreak
      } : null);
      
      if (!activePowerUps.doublePoints) {
        toast.success(`+${points} points!`);
      }
    } else {
      // Wrong answer - deduct life in survival mode
      if (currentSession.mode === 'survival') {
        const newLives = Math.max(0, currentSession.lives - 1);
        setCurrentSession(prev => prev ? {
          ...prev,
          lives: newLives,
          streak: 0
        } : null);
        
        toast.error(`Wrong answer! Lives remaining: ${newLives}`);
        
        if (newLives <= 0) {
          toast.error('Game Over! No lives remaining.');
          endQuiz();
          return;
        }
      } else {
        // Non-survival mode - just reset streak
        setCurrentSession(prev => prev ? {
          ...prev,
          streak: 0
        } : null);
        
        toast.error('Wrong answer!');
      }
    }

    // Show explanation immediately for better learning experience
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);

    // Proceed to next question after showing explanation
    setTimeout(() => {
      nextQuestion();
    }, 4000); // Increased time to allow better explanation reading
  };

  const handleMultiplayerAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentSession || !socket || !multiplayerState.roomId) return;
    
    setSelectedAnswer(answerIndex);
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Record the question answer for tracking (same as single player)
    const questionAnswer = {
      questionId: question.id,
      question: question.question,
      category: question.category || currentSession.category,
      difficulty: question.difficulty || 'medium',
      wasCorrect: isCorrect,
      userAnswer: answerIndex,
      correctAnswer: question.correctAnswer
    };
    
    setQuestionAnswers(prev => [...prev, questionAnswer]);
    
    if (soundEnabled) {
      playSound(isCorrect ? 'correct' : 'wrong');
    }

    // Submit answer to server
    socket.emit('submit-answer', {
      roomId: multiplayerState.roomId,
      questionIndex: currentSession.currentQuestionIndex,
      selectedAnswer: answerIndex,
      timeRemaining: timeLeft
    });

    if (isCorrect) {
      let points = question.points;
      
      // Apply double points power-up
      if (activePowerUps.doublePoints) {
        points *= 2;
        setActivePowerUps(prev => ({
          ...prev,
          doublePoints: false
        }));
        toast.success(`Double points applied! +${points} points! 💎`);
      }
      
      const newScore = currentSession.score + points;
      const newStreak = currentSession.streak + 1;
      
      setCurrentSession(prev => prev ? {
        ...prev,
        score: newScore,
        streak: newStreak
      } : null);
      
      if (!activePowerUps.doublePoints) {
        toast.success(`+${points} points!`);
      }
    } else {
      // Wrong answer in multiplayer - just reset streak
      setCurrentSession(prev => prev ? {
        ...prev,
        streak: 0
      } : null);
      
      toast.error('Wrong answer!');
    }

    // Show explanation immediately for better learning experience in multiplayer
    setTimeout(() => {
      setShowExplanation(true);
    }, 1500);
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    const nextIndex = currentSession.currentQuestionIndex + 1;
    
    if (nextIndex >= currentSession.questions.length) {
      endQuiz();
      return;
    }

    setCurrentSession(prev => prev ? {
      ...prev,
      currentQuestionIndex: nextIndex
    } : null);
    
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(currentSession.questions[nextIndex].timeLimit);
  };

  const handleTimeout = () => {
    if (!currentSession) return;
    
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    
    // Record timeout as incorrect answer for tracking
    const questionAnswer = {
      questionId: question.id,
      question: question.question,
      category: question.category || currentSession.category,
      difficulty: question.difficulty || 'medium',
      wasCorrect: false,
      userAnswer: -1, // Indicate timeout
      correctAnswer: question.correctAnswer
    };
    
    setQuestionAnswers(prev => [...prev, questionAnswer]);
    
    if (currentSession.mode === 'survival') {
      const newLives = Math.max(0, currentSession.lives - 1);
      setCurrentSession(prev => prev ? {
        ...prev,
        lives: newLives,
        streak: 0
      } : null);
      
      toast.error(`Time's up! Lives remaining: ${newLives}`);
      
      if (newLives <= 0) {
        toast.error('Game Over! No lives remaining.');
        endQuiz();
        return;
      }
    } else {
      setCurrentSession(prev => prev ? {
        ...prev,
        streak: 0
      } : null);
      
      toast.error("Time's up!");
    }

    // Show explanation for timed out question
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);

    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const endQuiz = () => {
    if (currentSession) {
      recordQuizCompletion(currentSession);
    }
    setGameMode('results');
    if (soundEnabled) {
      playSound('game-end');
    }
  };

  const recordQuizCompletion = async (session: QuizSession) => {
    try {
      const timeTaken = Math.round((Date.now() - session.startTime.getTime()) / 1000); // in seconds
      
      // Calculate actual correct answers based on tracked data
      const actualCorrectAnswers = questionAnswers.filter(qa => qa.wasCorrect).length;
      
      const response = await fetch(`${API_BASE_URL}/api/user/quiz-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameMode: session.mode,
          category: session.category,
          score: session.score,
          questionsAnswered: session.currentQuestionIndex + 1,
          correctAnswers: actualCorrectAnswers,
          timeTaken,
          streak: session.streak,
          questions: questionAnswers, // Send detailed question data for history tracking
          averageTimePerQuestion: Math.round(timeTaken / (session.currentQuestionIndex + 1))
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.newAchievements && result.newAchievements.length > 0) {
          toast.success(`New achievement unlocked! 🎉`);
        }
        // Reload player stats and achievements to reflect changes
        loadPlayerStats();
        loadAchievements();
        loadLeaderboard();
      } else {
        console.error('Failed to record quiz completion');
      }
    } catch (error) {
      console.error('Error recording quiz completion:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentSession(null);
    setGameMode('menu');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(0);
    setQuestionAnswers([]); // Clear question tracking
    
    // Reset power-ups
    setActivePowerUps({
      doublePoints: false,
      fiftyFifty: false,
      usedFiftyFiftyQuestions: new Set()
    });
  };

  const getCurrentQuestion = () => {
    if (!currentSession) return null;
    return currentSession.questions[currentSession.currentQuestionIndex];
  };

  // Handle document upload and quiz generation
  const handleQuizGenerated = (quiz: any) => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      // Ensure all questions have explanations
      const questionsWithExplanations = quiz.questions.map((q: any, index: number) => ({
        ...q,
        explanation: q.explanation || `The correct answer is option ${q.correctAnswer + 1}. This question is based on your uploaded documents.`,
        id: q.id || `doc_q_${Date.now()}_${index}`,
        timeLimit: q.timeLimit || 60
      }));

      const session: QuizSession = {
        id: Date.now().toString(),
        mode: selectedGameMode as any,
        category: 'Document Upload',
        difficulty: 'adaptive',
        questions: questionsWithExplanations,
        currentQuestionIndex: 0,
        score: 0,
        lives: selectedGameMode === 'survival' ? 3 : 1,
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date()
      };
      
      setCurrentSession(session);
      setTimeLeft(questionsWithExplanations[0]?.timeLimit || 60);
      setGameMode('playing');
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionAnswers([]);
      setShowDocumentUploader(false);
      
      if (soundEnabled) {
        playSound('game-start');
      }
      
      toast.success(`Generated ${quiz.questions.length} questions from your files!`);
    }
  };

  const openDocumentUploader = (mode: string) => {
    setSelectedGameMode(mode);
    setShowDocumentUploader(true);
  };

  // Results screen
  if (gameMode === 'results' && currentSession) {
    return (
      <AppLayout pageTitle="Quiz Results">
        <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-card/90 backdrop-blur border shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  Quiz Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{currentSession.score}</div>
                    <div className="text-muted-foreground">Final Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">
                      {Math.round(((questionAnswers.filter(qa => qa.wasCorrect).length) / (currentSession.currentQuestionIndex + 1)) * 100)}%
                    </div>
                    <div className="text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">{currentSession.streak}</div>
                    <div className="text-muted-foreground">Best Streak</div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button onClick={resetQuiz} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={() => setGameMode('menu')}>
                    Back to Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Playing screen
  if (gameMode === 'playing' && currentSession) {
    const question = getCurrentQuestion();
    if (!question) return null;

    return (
      <AppLayout pageTitle="Quiz Arena">
        <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <Card className="bg-card/90 backdrop-blur border shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {currentSession.currentQuestionIndex + 1} / {currentSession.questions.length}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className={`font-mono text-lg ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="font-bold">{currentSession.score}</span>
                    </div>
                    {currentSession.mode === 'survival' && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: currentSession.lives }, (_, i) => (
                          <div key={i} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">❤️</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Progress value={(timeLeft / question.timeLimit) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="bg-card/90 backdrop-blur border shadow-lg mb-6">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{question.difficulty}</Badge>
                    <Badge variant="outline">{question.category}</Badge>
                    <div className="ml-auto flex items-center gap-1">
                      <Target className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{question.points} pts</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold leading-relaxed">{question.question}</h2>
                </div>

                {/* Answer Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === question.correctAnswer;
                    const showResult = selectedAnswer !== null;
                    
                    // 50/50 power-up logic: hide 2 wrong answers
                    if (activePowerUps.usedFiftyFiftyQuestions.has(question.id) && !isCorrect) {
                      // For 50/50, keep only correct answer and one random wrong answer
                      const wrongAnswers = question.options
                        .map((_, i) => i)
                        .filter(i => i !== question.correctAnswer);
                      
                      // Use deterministic selection based on question ID to ensure consistency
                      const selectedWrongIndex = wrongAnswers[0]; // Keep first wrong answer
                      
                      if (index !== selectedWrongIndex) {
                        return null; // Hide this wrong option
                      }
                    }
                    
                    // Enhanced button color logic for better visual feedback
                    let buttonClass = 'bg-card hover:bg-muted border text-foreground transition-all duration-300';
                    
                    if (showResult) {
                      if (isCorrect) {
                        // Always highlight correct answer in green
                        buttonClass = 'bg-green-500 hover:bg-green-600 border-green-400 text-white font-semibold shadow-lg transform scale-105';
                      } else if (isSelected && !isCorrect) {
                        // Highlight user's wrong answer in red
                        buttonClass = 'bg-red-500 hover:bg-red-600 border-red-400 text-white font-semibold shadow-lg';
                      } else {
                        // Non-selected wrong answers in muted style
                        buttonClass = 'bg-muted/50 border-muted text-muted-foreground opacity-60';
                      }
                    } else if (isSelected) {
                      // While answering, show selection feedback
                      buttonClass = 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
                    }

                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className={`w-full h-auto p-4 text-left justify-start ${buttonClass}`}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={selectedAnswer !== null}
                        >
                          <span className="font-medium mr-3">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanation && question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">💡</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Explanation</h4>
                        <p className="text-blue-700 dark:text-blue-300">{question.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Fallback for missing explanation */}
                {showExplanation && !question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">ℹ️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Correct Answer</h4>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          The correct answer is option {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Main menu
  return (
    <AppLayout pageTitle="AI Quiz Arena">
      <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              <Flame className="inline-block h-12 w-12 mr-4 text-orange-400" />
              AI Quiz Arena
            </h1>
            <p className="text-white/80 text-lg">
              Challenge yourself with adaptive AI-generated quizzes
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Battle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <motion.div key={category.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="bg-card/90 backdrop-blur border shadow-lg hover:shadow-xl transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {gameModes.map((mode) => (
                          <Button
                            key={mode.id}
                            variant="outline"
                            size="sm"
                            onClick={() => startQuiz(category.id, mode.id)}
                            className="text-xs"
                          >
                            {mode.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Game Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Game Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gameModes.map((mode) => (
                <motion.div key={mode.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className="bg-card/90 backdrop-blur border shadow-lg hover:shadow-xl transition-all cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center mx-auto mb-4 text-white`}>
                        {mode.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-2">{mode.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{mode.description}</p>
                      <Button
                        onClick={() => openDocumentUploader(mode.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Docs
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Player Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="bg-card/90 backdrop-blur border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Level</span>
                    <Badge>{playerStats.level}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Quizzes</span>
                    <span className="font-mono">{playerStats.totalQuizzes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Accuracy</span>
                    <span className="font-mono">
                      {playerStats.totalQuizzes > 0 
                        ? Math.round(((playerStats.correctAnswers || 0) / ((playerStats.totalQuizzes || 1) * 10)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Best Streak</span>
                    <span className="font-mono">{playerStats.bestStreak}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Medal className="h-5 w-5 mr-2 text-yellow-500" />
                  Global Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {entry.rank}
                        </div>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <span className="font-mono text-sm">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Connection Status */}
        <AnimatePresence>
          {showConnectionError && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-4 right-4 bg-red-100 dark:bg-red-900/20 backdrop-blur border border-red-300 dark:border-red-700 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                Connection lost. Retrying...
              </div>
            </motion.div>
          )}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-4 right-4 bg-green-100 dark:bg-green-900/20 backdrop-blur border border-green-300 dark:border-green-700 rounded-lg p-3 text-green-800 dark:text-green-200 text-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Connected
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Uploader Modal */}
        <AnimatePresence>
          {showDocumentUploader && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-card rounded-lg border shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Upload Documents</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDocumentUploader(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <DocumentUploader 
                    onQuizGenerated={handleQuizGenerated} 
                    gameMode={selectedGameMode}
                    onClose={() => setShowDocumentUploader(false)}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default AIQuizArena;
