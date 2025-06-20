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
      description: 'Real-time PvP battles',
      icon: <Sword className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  // Sound functions
  const playSound = (type: string) => {
    if (!soundEnabled) return;
    
    const audio = new Audio();
    switch (type) {
      case 'correct':
        audio.src = '/sounds/correct.mp3';
        break;
      case 'wrong':
        audio.src = '/sounds/wrong.mp3';
        break;
      case 'game-start':
        audio.src = '/sounds/game-start.mp3';
        break;
      case 'game-end':
        audio.src = '/sounds/game-end.mp3';
        break;
      case 'power-up':
        audio.src = '/sounds/power-up.mp3';
        break;
      default:
        return;
    }
    audio.play().catch(console.warn);
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: token
      }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setShowConnectionError(false);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setShowConnectionError(true);
      console.log('Disconnected from server');
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Timer effect
  useEffect(() => {
    if (gameMode !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, timeLeft]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleGameFound = (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        inQueue: false,
        gameFound: true,
        roomId: data.roomId,
        opponent: data.opponent
      }));
      
      const session: QuizSession = {
        id: data.roomId,
        mode: 'multiplayer',
        category: data.category,
        difficulty: data.difficulty,
        questions: data.questions.map((q: any) => ({
          ...q,
          timeLimit: q.timeLimit || 30
        })),
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
      
      toast.success(`Game found! Playing against ${data.opponent.name}`);
    };

    const handleQuestionResults = (data: any) => {
      const { results, correctAnswer } = data;
      const myResult = results.find((r: any) => r.playerId === user?.id);
      const opponentResult = results.find((r: any) => r.playerId !== user?.id);
      
      if (myResult && currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          score: myResult.totalScore,
          streak: myResult.isCorrect ? prev.streak + 1 : 0
        } : null);
      }
      
      setMultiplayerState(prev => ({
        ...prev,
        opponentScore: opponentResult?.totalScore || 0,
        opponentAnswered: false
      }));
      
      if (myResult) {
        const currentQ = currentSession?.questions[currentSession.currentQuestionIndex];
        const correctAnswerText = currentQ?.options[correctAnswer] || 'Unknown';
        
        const message = myResult.isCorrect 
          ? `✅ Correct! +${myResult.points} points`
          : `❌ Wrong. Correct answer: ${correctAnswerText}`;
        toast.success(message);
      }
      
      setTimeout(() => {
        setShowExplanation(true);
      }, 1500);
    };

    const handleNextQuestion = (data: any) => {
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          currentQuestionIndex: data.questionIndex
        } : null);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setTimeLeft(data.question.timeLimit || 30);
      }
    };

    const handleGameFinished = (data: any) => {
      setGameMode('results');
      
      if (data.tie) {
        toast.success('🤝 It\'s a tie! Great game!');
      } else if (data.winner) {
        const isWinner = data.winner.playerId === user?.id;
        toast.success(isWinner ? '🎉 You won the battle!' : `🏆 ${data.winner.playerName} wins! Good game!`);
      }
      
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          score: data.players.find((p: any) => p.playerId === user?.id)?.score || prev.score
        } : null);
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
    };

    socket.on('game-found', handleGameFound);
    socket.on('question-results', handleQuestionResults);
    socket.on('next-question', handleNextQuestion);
    socket.on('game-finished', handleGameFinished);

    socket.on('opponent-answered', () => {
      setMultiplayerState(prev => ({
        ...prev,
        opponentAnswered: true
      }));
    });

    socket.on('opponent-disconnected', () => {
      toast.success('Your opponent disconnected. You win!');
      setGameMode('results');
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
      socket.off('game-found');
      socket.off('question-results');
      socket.off('next-question');
      socket.off('game-finished');
      socket.off('opponent-answered');
      socket.off('opponent-disconnected');
    };
  }, [socket, user, currentSession]);

  const startQuiz = async (category: string, mode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          mode,
          userId: user?.id,
          excludeQuestions: questionAnswers.map(qa => qa.questionId)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start quiz');
      }

      const data = await response.json();
      const { questions } = data;

      const session: QuizSession = {
        id: Date.now().toString(),
        mode: mode as any,
        category,
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
      
      setQuestionAnswers([]);
      setActivePowerUps({
        doublePoints: false,
        fiftyFifty: false,
        usedFiftyFiftyQuestions: new Set()
      });
      
      if (soundEnabled) {
        playSound('game-start');
      }
      
      toast.success(`🚀 ${mode} quiz started!`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz. Please try again.');
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentSession) return;
    
    setSelectedAnswer(answerIndex);
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
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
        setCurrentSession(prev => prev ? {
          ...prev,
          streak: 0
        } : null);
        
        toast.error('Wrong answer!');
      }
    }

    setTimeout(() => {
      setShowExplanation(true);
    }, 500);

    setTimeout(() => {
      nextQuestion();
    }, 4000);
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
    
    const questionAnswer = {
      questionId: question.id,
      question: question.question,
      category: question.category || currentSession.category,
      difficulty: question.difficulty || 'medium',
      wasCorrect: false,
      userAnswer: -1,
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
      
      toast.error('Time\'s up!');
    }

    setTimeout(() => {
      setShowExplanation(true);
    }, 500);

    setTimeout(() => {
      nextQuestion();
    }, 2500);
  };

  const endQuiz = () => {
    setGameMode('results');
    if (soundEnabled) {
      playSound('game-end');
    }
  };

  const resetQuiz = () => {
    setCurrentSession(null);
    setGameMode('menu');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(0);
    setQuestionAnswers([]);
    
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

  const joinMultiplayerQueue = (category: string, difficulty: string) => {
    if (!socket || !user) return;

    socket.emit('join-multiplayer-queue', {
      playerId: user.id,
      playerName: user.name,
      category,
      difficulty
    });

    setMultiplayerState(prev => ({
      ...prev,
      inQueue: true
    }));

    toast.success('Joining multiplayer queue...');
  };

  const usePowerUp = (type: string) => {
    if (!currentSession) return;
    
    const question = getCurrentQuestion();
    if (!question) return;

    switch (type) {
      case 'fifty_fifty':
        if (activePowerUps.usedFiftyFiftyQuestions.has(question.id)) {
          toast.error('50/50 already used on this question!');
          return;
        }
        
        setActivePowerUps(prev => ({
          ...prev,
          fiftyFifty: true,
          usedFiftyFiftyQuestions: new Set([...prev.usedFiftyFiftyQuestions, question.id])
        }));
        
        if (soundEnabled) {
          playSound('power-up');
        }
        
        toast.success('50/50 activated! Two wrong answers removed!');
        break;
        
      case 'double_points':
        setActivePowerUps(prev => ({
          ...prev,
          doublePoints: true
        }));
        
        if (soundEnabled) {
          playSound('power-up');
        }
        
        toast.success('Double points activated! Next correct answer worth 2x points!');
        break;
    }
  };

  // Render results screen
  if (gameMode === 'results' && currentSession) {
    return (
      <AppLayout pageTitle="Quiz Results">
        <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="text-center bg-card/90 backdrop-blur border shadow-lg">
              <CardHeader>
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                  className="mx-auto w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-4"
                >
                  <Trophy className="h-10 w-10 text-yellow-900" />
                </motion.div>
                <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Final Score</p>
                    <p className="text-2xl font-bold text-foreground">{currentSession.score}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                    <p className="text-2xl font-bold text-foreground">{currentSession.streak}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round((currentSession.score / (currentSession.questions.length * 100)) * 100)}%
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Time Taken</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round((Date.now() - currentSession.startTime.getTime()) / 60000)}m
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={resetQuiz} className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="outline" onClick={resetQuiz} className="w-full">
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

  // Render playing screen
  if (gameMode === 'playing' && currentSession) {
    const question = getCurrentQuestion();
    if (!question) return null;

    return (
      <AppLayout pageTitle="Quiz Arena - Playing">
        <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-6">
          
          {/* Game HUD */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex items-center justify-between bg-card/80 backdrop-blur rounded-lg p-4 border shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-foreground">{currentSession.score}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-foreground">Streak: {currentSession.streak}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground">Lives:</span>
                  {Array.from({ length: currentSession.lives }).map((_, i) => (
                    <span key={i} className="text-red-500">❤️</span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-foreground" />
                  <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                    {timeLeft}s
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/90 backdrop-blur border shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="bg-primary/20">
                    Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                  </Badge>
                  <Badge variant="outline" className="bg-primary/20">
                    {question.difficulty} • {question.points} points
                  </Badge>
                </div>
                <Progress 
                  value={(currentSession.currentQuestionIndex / currentSession.questions.length) * 100} 
                  className="h-2 mb-4"
                />
                <CardTitle className="text-xl leading-relaxed text-foreground">
                  {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === question.correctAnswer;
                    const isWrong = isSelected && !isCorrect;
                    const isHidden = activePowerUps.fiftyFifty && 
                                   !isCorrect && 
                                   selectedAnswer === null && 
                                   Math.random() > 0.5;

                    if (isHidden) return <div key={index} className="opacity-0" />;

                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                        whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                      >
                        <Button
                          variant="outline"
                          disabled={selectedAnswer !== null}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full h-auto min-h-[60px] p-4 text-left justify-start text-wrap ${
                            showExplanation && isCorrect 
                              ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300' 
                              : showExplanation && isWrong
                              ? 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300'
                              : isSelected
                              ? 'bg-primary/20 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <span className="mr-3 font-bold">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Power-ups */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => usePowerUp('fifty_fifty')}
                    disabled={activePowerUps.usedFiftyFiftyQuestions.has(question.id) || selectedAnswer !== null}
                    className="bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    50/50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => usePowerUp('double_points')}
                    disabled={activePowerUps.doublePoints || selectedAnswer !== null}
                    className="bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    2x Points
                  </Button>
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary"
                    >
                      <h4 className="font-semibold text-foreground mb-2">Explanation:</h4>
                      <p className="text-muted-foreground">{question.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Multiplayer info */}
          {currentSession.mode === 'multiplayer' && multiplayerState.opponent && (
            <div className="max-w-4xl mx-auto mt-6">
              <Card className="bg-card/80 backdrop-blur border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">You</p>
                        <p className="text-lg font-bold text-foreground">{currentSession.score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">VS</p>
                        <Sword className="h-6 w-6 mx-auto text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{multiplayerState.opponent.name}</p>
                        <p className="text-lg font-bold text-foreground">{multiplayerState.opponentScore}</p>
                      </div>
                    </div>
                    {multiplayerState.opponentAnswered && (
                      <Badge variant="outline" className="bg-green-500/20 text-green-700 dark:text-green-300">
                        Opponent answered!
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Render main menu
  return (
    <AppLayout pageTitle="AI Quiz Arena">
      <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-primary/80 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-12 w-12 text-yellow-400 mr-4" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                AI Quiz Arena
              </h1>
              <Crown className="h-12 w-12 text-yellow-400 ml-4" />
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your knowledge, climb the leaderboards, and become the ultimate quiz champion!
            </p>
          </motion.div>

          {/* Connection Status */}
          {showConnectionError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Card className="bg-red-500/10 border-red-500/50">
                <CardContent className="p-4 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-500">Connection issues detected. Some features may be limited.</span>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Game Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Choose Your Battle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gameModes.map((mode, index) => (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                      selectedGameMode === mode.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedGameMode(mode.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center text-white`}>
                        {mode.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-foreground">{mode.name}</h3>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Select Your Domain</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg border hover:border-primary/50"
                    onClick={() => {
                      if (selectedGameMode === 'multiplayer') {
                        joinMultiplayerQueue(category.id, 'medium');
                      } else {
                        startQuiz(category.id, selectedGameMode);
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center text-3xl`}>
                        {category.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-foreground">{category.name}</h3>
                      <Button className="w-full mt-4">
                        <ChevronRight className="h-4 w-4 mr-2" />
                        {selectedGameMode === 'multiplayer' ? 'Join Queue' : 'Start Quiz'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Document Uploader */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Card className="bg-card/90 backdrop-blur border">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-foreground">
                  <Upload className="h-6 w-6 mr-2" />
                  Custom Quiz from Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Upload your own documents to generate personalized quizzes
                </p>
                <Button onClick={() => setShowDocumentUploader(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Multiplayer Queue Status */}
          {multiplayerState.inQueue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <Card className="w-96">
                <CardContent className="p-6 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Finding Opponent...</h3>
                  <p className="text-muted-foreground mb-4">Please wait while we match you with another player</p>
                  <Button variant="outline" onClick={() => setMultiplayerState(prev => ({ ...prev, inQueue: false }))}>
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Document Uploader Modal */}
          {showDocumentUploader && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-2xl">
                <DocumentUploader
                  gameMode={selectedGameMode}
                  onClose={() => setShowDocumentUploader(false)}
                  onQuizGenerated={(questions) => {
                    const session: QuizSession = {
                      id: Date.now().toString(),
                      mode: 'classic',
                      category: 'Custom',
                      difficulty: 'adaptive',
                      questions,
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
                    setShowDocumentUploader(false);
                    
                    if (soundEnabled) {
                      playSound('game-start');
                    }
                    
                    toast.success('Custom quiz started!');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AIQuizArena;
