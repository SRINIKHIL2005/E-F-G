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
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  category: string;
  points: number;
  timeLimit: number;
  difficultyRating: number; // 1-10 scale like LeetCode
  tags: string[];
  topicLevel: number; // 1-5 for progressive difficulty
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
  accuracy: number;
  totalTimeUsed: number;
  bonusMultiplier: number;
  levelProgression: number;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'time_freeze' | 'fifty_fifty' | 'extra_life' | 'double_points' | 'hint' | 'shield' | 'lightning' | 'wisdom';
  cost: number;
  available: boolean;
  duration?: number;
  cooldown?: number;
  effectiveness: number;
}

interface PlayerProgress {
  level: number;
  xp: number;
  coins: number;
  totalQuizzes: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeSpent: number;
  averageAccuracy: number;
  categoryMastery: { [category: string]: number };
  skillRating: number; // ELO-like rating system
  rank: string; // Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster
  powerUpsUsed: number;
  achievementsUnlocked: number;
  multiplayerWins: number;
  multiplayerLosses: number;
  survivalBestScore: number;
  speedBestScore: number;
  classicBestScore: number;
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
  const [gameMode, setGameMode] = useState<'menu' | 'playing' | 'results'>('menu');
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<string>('classic');
  const [activePowerUps, setActivePowerUps] = useState<{
    doublePoints: boolean;
    fiftyFifty: boolean;
    usedFiftyFiftyQuestions: Set<string>;
  }>({
    doublePoints: false,
    fiftyFifty: false,
    usedFiftyFiftyQuestions: new Set()
  });  const [questionHistory, setQuestionHistory] = useState<Set<string>>(new Set());
  const [playerStats, setPlayerStats] = useState<PlayerProgress>({
    level: 1,
    xp: 0,
    coins: 100,
    totalQuizzes: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeSpent: 0,
    averageAccuracy: 0,
    categoryMastery: {},
    skillRating: 1000,
    rank: 'Bronze',
    powerUpsUsed: 0,
    achievementsUnlocked: 0,
    multiplayerWins: 0,
    multiplayerLosses: 0,
    survivalBestScore: 0,
    speedBestScore: 0,
    classicBestScore: 0
  });  const [usedPowerUps, setUsedPowerUps] = useState<Set<string>>(new Set());
  const [timeFreezeDuration, setTimeFreezeDuration] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [lightningMode, setLightningMode] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);  // Categories for quiz generation
  const categories = [
    { id: 'javascript', name: 'JavaScript Mastery', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'react', name: 'React Kingdom', icon: '⚛️', color: 'from-blue-400 to-cyan-500' },
    { id: 'algorithms', name: 'Algorithm Arena', icon: '🧮', color: 'from-purple-400 to-pink-500' },
    { id: 'databases', name: 'Database Dungeon', icon: '�️', color: 'from-green-400 to-emerald-500' },
    { id: 'security', name: 'Cyber Fortress', icon: '�️', color: 'from-red-400 to-rose-500' },
    { id: 'ai', name: 'AI Universe', icon: '🤖', color: 'from-indigo-400 to-purple-500' },
    { id: 'python', name: 'Python Playground', icon: '🐍', color: 'from-green-500 to-blue-500' },
    { id: 'webdev', name: 'Web Development', icon: '🌐', color: 'from-pink-400 to-red-500' }
  ];
  // Helper function to get readable category name
  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name.toLowerCase() : categoryId.toLowerCase();
  };

  // Helper function to calculate question points based on difficulty and mode
  const calculateQuestionPoints = (difficulty: string, mode: string) => {
    const basePoints = {
      'Easy': 50,
      'Medium': 100,
      'Hard': 150,
      'Expert': 200,
      'Master': 250
    };
    
    let points = basePoints[difficulty as keyof typeof basePoints] || 100;
    
    // Mode-specific multipliers
    switch (mode) {
      case 'speed':
        points *= 1.2; // Bonus for speed mode
        break;
      case 'survival':
        points *= 1.5; // Higher stakes for survival
        break;
      case 'multiplayer':
        points *= 1.3; // Competitive bonus
        break;
      case 'classic':
      default:
        points *= 1.0; // Standard points
        break;
    }
    
    return Math.round(points);
  };
  // Helper function to calculate difficulty rating (1-10 scale like CodeChef/LeetCode)
  const calculateDifficultyRating = (difficulty: string) => {
    const ratings = {
      'Easy': 2,
      'Medium': 5,
      'Hard': 7,
      'Expert': 9,
      'Master': 10
    };
    
    return ratings[difficulty as keyof typeof ratings] || 5;
  };
  // Helper function declaration removed to prevent duplicate
  
  // Helper function to determine if player levels up based on XP
  const checkLevelUp = (currentXP: number, currentLevel: number) => {
    const xpNeededForLevel = (level: number) => level * 1000; // Progressive XP requirement
    const xpForNextLevel = xpNeededForLevel(currentLevel);
    
    if (currentXP >= xpForNextLevel) {
      return {
        levelUp: true,
        newLevel: currentLevel + 1,
        xpToNextLevel: xpNeededForLevel(currentLevel + 1) - currentXP
      };
    }
    
    return {
      levelUp: false,
      newLevel: currentLevel,
      xpToNextLevel: xpForNextLevel - currentXP
    };
  };

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
    opponentScore: number;    opponentAnswered: boolean;
    serverResultsReceived: boolean;
  }>({
    inQueue: false,
    gameFound: false,
    roomId: null,
    opponent: null,
    gameStarted: false,
    opponentScore: 0,
    opponentAnswered: false,
    serverResultsReceived: false
  });

  const gameModes = [
    {
      id: 'classic',
      name: 'Classic Quest',
      description: '10 balanced questions • 30s each • Educational focus • All power-ups available',
      icon: <Brain className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      features: ['Educational explanations', 'Balanced difficulty', 'Standard scoring', 'All power-ups work']
    },
    {
      id: 'speed',
      name: 'Lightning Round',
      description: '15 quick-fire questions • 10s each • Rapid recall • Time-based power-ups enhanced',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-yellow-500 to-yellow-600',
      features: ['Fast-paced questions', 'Quick recall focus', 'Time pressure', 'Speed bonuses']
    },
    {
      id: 'survival',
      name: 'Survival Mode',
      description: '50 escalating questions • 3 lives • Progressive difficulty • Extra life power-up',
      icon: <Shield className="h-6 w-6" />,
      color: 'from-red-500 to-red-600',
      features: ['Progressive difficulty', 'Life system', 'Endurance challenge', 'High stakes']
    },
    {
      id: 'multiplayer',
      name: 'Battle Arena',
      description: '8 competitive questions • Real-time PvP • Skill-based matching • All power-ups',
      icon: <Sword className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      features: ['Real-time competition', 'Fair matching', 'Competitive scoring', 'Strategic power-ups']
    }
  ];
  useEffect(() => {
    initializePowerUps();
    loadAchievements();
    loadLeaderboard();
    loadPlayerStats();
    loadQuestionHistory();
  }, []);

  useEffect(() => {
    saveQuestionHistory();
  }, [questionHistory]);

  const loadQuestionHistory = () => {
    try {
      const userId = user?.id;
      if (userId) {
        const saved = localStorage.getItem(`quiz_history_${userId}`);
        if (saved) {
          const history = JSON.parse(saved);
          setQuestionHistory(new Set(history));
          console.log(`📚 Loaded question history: ${history.length} questions`);
        }
      }
    } catch (error) {
      console.error('Error loading question history:', error);
    }
  };

  const saveQuestionHistory = () => {
    try {
      const userId = user?.id;
      if (userId && questionHistory.size > 0) {
        localStorage.setItem(`quiz_history_${userId}`, JSON.stringify(Array.from(questionHistory)));
        console.log(`💾 Saved question history: ${questionHistory.size} questions`);
      }
    } catch (error) {
      console.error('Error saving question history:', error);
    }
  };

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
  const initializePowerUps = () => {
    setPowerUps([
      {
        id: 'time_freeze',
        name: 'Time Freeze',
        description: 'Stop the timer for 10 seconds',
        icon: '❄️',
        type: 'time_freeze',
        cost: 20,
        available: true,
        duration: 10,
        cooldown: 0,
        effectiveness: 100
      },
      {
        id: 'fifty_fifty',
        name: '50/50',
        description: 'Remove 2 wrong answers',
        icon: '✂️',
        type: 'fifty_fifty',
        cost: 15,
        available: true,
        effectiveness: 100
      },
      {
        id: 'extra_life',
        name: 'Extra Life',
        description: 'Gain an additional life (Survival mode)',
        icon: '❤️',
        type: 'extra_life',
        cost: 30,
        available: true,
        effectiveness: 100
      },
      {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double points for next 3 questions',
        icon: '💎',
        type: 'double_points',
        cost: 25,
        available: true,
        duration: 3,
        effectiveness: 200
      },
      {
        id: 'ai_hint',
        name: 'AI Wisdom',
        description: 'Get a smart hint from AI',
        icon: '💡',
        type: 'hint',
        cost: 10,
        available: true,
        effectiveness: 80
      },
      {
        id: 'shield',
        name: 'Answer Shield',
        description: 'Protect from one wrong answer',
        icon: '🛡️',
        type: 'shield',
        cost: 35,
        available: true,
        duration: 1,
        effectiveness: 100
      },
      {
        id: 'lightning',
        name: 'Lightning Mode',
        description: 'Gain extra points for fast answers',
        icon: '⚡',
        type: 'lightning',
        cost: 40,
        available: true,
        duration: 5,
        effectiveness: 150
      },
      {
        id: 'wisdom',
        name: 'Ancient Wisdom',
        description: 'Reveal question difficulty and category',
        icon: '🔮',
        type: 'wisdom',
        cost: 12,
        available: true,
        effectiveness: 100
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
        const quizStats = data.quizStats || {};
        
        // Define achievement definitions that match the backend
        const achievementDefinitions = [
          { id: 'first_quiz', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', rarity: 'Common' as const },
          { id: 'quiz_master', name: 'Quiz Master', description: 'Complete 50 quizzes', icon: '👑', rarity: 'Legendary' as const },
          { id: 'streak_5', name: 'Streak Starter', description: 'Achieve a 5-question streak', icon: '🔥', rarity: 'Common' as const },
          { id: 'streak_25', name: 'Streak Master', description: 'Achieve a 25-question streak', icon: '⚡', rarity: 'Epic' as const },
          { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', rarity: 'Rare' as const },
          { id: 'level_10', name: 'Expert Player', description: 'Reach level 10', icon: '💎', rarity: 'Epic' as const },
          { id: 'coins_500', name: 'Coin Collector', description: 'Collect 500 coins', icon: '🪙', rarity: 'Rare' as const },
          { id: 'accuracy_90', name: 'Precision Master', description: 'Achieve 90% accuracy', icon: '🎯', rarity: 'Epic' as const }
        ];
        
        // Convert user achievements to achievement objects with progress
        const userAchievements = quizStats.achievements || [];
        const achievementObjects = achievementDefinitions.map(def => {
          const userAchievement = userAchievements.find((a: any) => a.achievementId === def.id);
          let progress = 0;
          let maxProgress = 1;
          let unlocked = !!userAchievement;
          
          // Calculate progress for non-unlocked achievements
          if (!unlocked) {
            switch (def.id) {
              case 'first_quiz':
                progress = Math.min(quizStats.totalQuizzes || 0, 1);
                maxProgress = 1;
                break;
              case 'quiz_master':
                progress = Math.min(quizStats.totalQuizzes || 0, 50);
                maxProgress = 50;
                break;
              case 'streak_5':
                progress = Math.min(quizStats.bestStreak || 0, 5);
                maxProgress = 5;
                break;
              case 'streak_25':
                progress = Math.min(quizStats.bestStreak || 0, 25);
                maxProgress = 25;
                break;
              case 'level_5':
                progress = Math.min(quizStats.level || 1, 5);
                maxProgress = 5;
                break;
              case 'level_10':
                progress = Math.min(quizStats.level || 1, 10);
                maxProgress = 10;
                break;
              case 'coins_500':
                progress = Math.min(quizStats.coins || 0, 500);
                maxProgress = 500;
                break;
              case 'accuracy_90':
                const accuracy = (quizStats.totalQuizzes || 0) > 0 
                  ? Math.round(((quizStats.correctAnswers || 0) / ((quizStats.totalQuizzes || 1) * 10)) * 100)
                  : 0;
                progress = Math.min(accuracy, 90);
                maxProgress = 90;
                break;
            }
          }
          
          return {
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            rarity: def.rarity,
            unlocked,
            progress: unlocked ? maxProgress : progress,
            maxProgress
          };
        });
        
        setAchievements(achievementObjects);
      } else {
        console.error('Failed to fetch user achievements');
        // Fallback to empty achievements
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      // Fallback to empty achievements  
      setAchievements([]);
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
        const leaderboardData = await response.json();
        setLeaderboard(leaderboardData.map((entry: any) => ({
          rank: entry.rank,
          username: entry.username,
          score: entry.score,
          category: entry.category,
          completedAt: new Date(entry.completedAt),
          avatar: entry.avatar
        })));
      } else {
        console.error('Failed to fetch leaderboard');
        // Fallback to empty leaderboard
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Fallback to empty leaderboard
      setLeaderboard([]);
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
        const quizStats = data.quizStats || {};        setPlayerStats({
          level: quizStats.level || 1,
          xp: quizStats.xp || 0,
          coins: quizStats.coins || 100,
          totalQuizzes: quizStats.totalQuizzes || 0,
          correctAnswers: quizStats.correctAnswers || 0,
          wrongAnswers: quizStats.wrongAnswers || 0,
          currentStreak: quizStats.currentStreak || 0,
          bestStreak: quizStats.bestStreak || 0,
          totalTimeSpent: quizStats.totalTimeSpent || 0,
          averageAccuracy: quizStats.averageAccuracy || 0,
          categoryMastery: quizStats.categoryMastery || {},
          skillRating: quizStats.skillRating || 1000,
          rank: quizStats.rank || 'Bronze',
          powerUpsUsed: quizStats.powerUpsUsed || 0,
          achievementsUnlocked: quizStats.achievementsUnlocked || 0,
          multiplayerWins: quizStats.multiplayerWins || 0,
          multiplayerLosses: quizStats.multiplayerLosses || 0,
          survivalBestScore: quizStats.survivalBestScore || 0,
          speedBestScore: quizStats.speedBestScore || 0,
          classicBestScore: quizStats.classicBestScore || 0
        });      } else {
        console.error('Failed to fetch user quiz stats');
        // Fallback to default values
        setPlayerStats({
          level: 1,
          xp: 0,
          coins: 100,
          totalQuizzes: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalTimeSpent: 0,
          averageAccuracy: 0,
          categoryMastery: {},
          skillRating: 1000,
          rank: 'Bronze',
          powerUpsUsed: 0,
          achievementsUnlocked: 0,
          multiplayerWins: 0,
          multiplayerLosses: 0,
          survivalBestScore: 0,
          speedBestScore: 0,
          classicBestScore: 0
        });
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
      // Fallback to default values
      setPlayerStats({
        level: 1,
        xp: 0,
        coins: 100,
        totalQuizzes: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        categoryMastery: {},
        skillRating: 1000,
        rank: 'Bronze',
        powerUpsUsed: 0,
        achievementsUnlocked: 0,
        multiplayerWins: 0,
        multiplayerLosses: 0,
        survivalBestScore: 0,
        speedBestScore: 0,
        classicBestScore: 0
      });
    }
  };  const startQuiz = async (category: string, mode: string) => {
    try {
      setShowDocumentUploader(false); // Close any open uploader
      
      console.log(`🎯 Starting ${mode.toUpperCase()} quiz for ${category}`);
      
      // Dynamic difficulty based on player level and streak
      const calculateDifficultyLevel = () => {
        let baseDifficulty = 'medium';
        
        // Adjust based on player level
        if (playerStats.level >= 15) {
          baseDifficulty = 'expert';
        } else if (playerStats.level >= 10) {
          baseDifficulty = 'hard';
        } else if (playerStats.level >= 5) {
          baseDifficulty = 'medium';
        } else {
          baseDifficulty = 'easy';
        }
        
        // Adjust based on current streak (adaptive difficulty)
        if (playerStats.currentStreak >= 10) {
          baseDifficulty = playerStats.level >= 10 ? 'master' : 'expert';
        } else if (playerStats.currentStreak >= 5) {
          baseDifficulty = playerStats.level >= 8 ? 'expert' : 'hard';
        }
        
        // Mode-specific adjustments
        switch (mode) {
          case 'speed':
            // Slightly easier for speed mode to maintain flow
            if (baseDifficulty === 'expert') baseDifficulty = 'hard';
            if (baseDifficulty === 'master') baseDifficulty = 'expert';
            break;
          case 'survival':
            // Progressive difficulty for survival
            baseDifficulty = 'progressive'; // Special mode for escalating difficulty
            break;
          case 'multiplayer':
            // Balanced difficulty for fair competition
            baseDifficulty = 'balanced';
            break;
        }
        
        return baseDifficulty;
      };
      
      // Mode-specific question counts and configurations
      let questionCount = 10;
      let difficultyLevel = calculateDifficultyLevel();
      
      switch (mode) {
        case 'speed':
          questionCount = 15; // More questions for speed mode
          break;
        case 'survival':
          questionCount = 50; // Many questions for survival
          break;
        case 'multiplayer':
          questionCount = 8; // Balanced for competition
          break;
        case 'classic':
          questionCount = 10; // Standard amount
          break;
        default:
          questionCount = 10;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-quiz-arena`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          subject: category,
          gameMode: mode,
          difficulty: difficultyLevel,
          questionCount: questionCount,
          topics: [], // Could add user preference topics here
          previousQuestions: Array.from(questionHistory), // Send question history to prevent repeats
          userId: user?.id // Include user ID for server-side history tracking
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Quiz Arena API Error:', response.status, errorData);
        throw new Error(`Failed to generate ${mode} quiz: ${response.status}`);
      }

      const quizData = await response.json();
      
      if (!quizData.success || !quizData.quiz) {
        throw new Error(quizData.message || 'AI generation failed - no template questions available');
      }
      
      // Extract questions from the correct path in API response
      const questions = quizData.quiz?.questions || quizData.questions;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid AI-generated questions received from API');
      }      // Validate questions before creating session
      const validQuestions = questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length >= 2 && // Allow at least 2 options instead of strict 4
        typeof q.correctAnswer === 'number' && 
        q.correctAnswer >= 0 && 
        q.correctAnswer < q.options.length && // Dynamic based on actual options length
        q.id // Only require ID, not specific format
      );

      if (validQuestions.length === 0) {
        console.log('No questions passed validation. Raw questions:', questions);
        throw new Error('No valid questions found in response');
      }      // Add explanations and ensure proper structure for all questions
      const processedQuestions = validQuestions.map((q, index) => {
        let explanation = q.explanation;
        
        // Generate better explanations if needed
        if (!explanation || explanation.trim() === '' || explanation.includes('tests your knowledge of')) {
          const correctOption = q.options[q.correctAnswer];
          const categoryName = getCategoryDisplayName(category);
          
          const categoryExplanations: {[key: string]: string} = {
            'javascript mastery': `In JavaScript, "${correctOption}" is the correct answer because it follows proper syntax and best practices for modern JavaScript development.`,
            'react kingdom': `In React, "${correctOption}" is correct as it aligns with React's component lifecycle and state management principles.`,
            'algorithm arena': `For this algorithm, "${correctOption}" provides the optimal solution with the best time and space complexity.`,
            'database dungeon': `In database design, "${correctOption}" follows best practices for data integrity and query optimization.`,
            'cyber fortress': `From a security perspective, "${correctOption}" implements the most secure approach to prevent vulnerabilities.`,
            'ai universe': `In AI/ML, "${correctOption}" correctly applies machine learning principles and neural network concepts.`,
            'python playground': `In Python, "${correctOption}" leverages Python's syntax and libraries most effectively.`,
            'web development': `For web development, "${correctOption}" follows modern best practices for performance and user experience.`
          };
          
          explanation = categoryExplanations[categoryName.toLowerCase()] || 
                       `The correct answer is "${correctOption}". This demonstrates proper understanding of ${categoryName} concepts.`;
        }
        
        return {
          ...q,
          explanation,
          points: q.points || calculateQuestionPoints(q.difficulty || 'Medium', mode),
          timeLimit: q.timeLimit || (mode === 'speed' ? 15 : mode === 'survival' ? 20 : 30),
          category: getCategoryDisplayName(category),
          id: q.id || `${category}_${mode}_${Date.now()}_${index}`,
          difficultyRating: q.difficultyRating || calculateDifficultyRating(q.difficulty || 'Medium'),
          tags: q.tags || [category],
          topicLevel: q.topicLevel || Math.min(Math.floor(playerStats.level / 3) + 1, 5)
        };
      });      // Filter out questions that were recently asked - improve repeat prevention
      const historyArray = Array.from(questionHistory);
      let freshQuestions = processedQuestions.filter(q => !historyArray.includes(q.id));
      
      if (freshQuestions.length < questionCount) {
        console.log(`🔄 Only ${freshQuestions.length} fresh questions available, need ${questionCount}. Adding older questions.`);
        
        // If we don't have enough fresh questions, add some older ones
        const olderQuestions = processedQuestions.filter(q => historyArray.includes(q.id));
        const additionalNeeded = questionCount - freshQuestions.length;
        
        // Sort older questions by how long ago they were used (earliest in history = oldest usage)
        olderQuestions.sort((a, b) => {
          const aIndex = historyArray.indexOf(a.id);
          const bIndex = historyArray.indexOf(b.id);
          return aIndex - bIndex; // Earlier questions first (used longer ago)
        });
        
        freshQuestions = [...freshQuestions, ...olderQuestions.slice(0, additionalNeeded)];
      }

      const finalQuestions = freshQuestions.slice(0, questionCount);

      // Add ONLY the final selected questions to history to prevent future repeats
      const newQuestionIds = finalQuestions.map(q => q.id);
      setQuestionHistory(prev => {
        const updated = new Set([...prev, ...newQuestionIds]);
        console.log(`📚 Question history updated: ${prev.size} -> ${updated.size} total questions tracked`);
        return updated;
      });console.log(`✅ Validated ${processedQuestions.length} questions for ${mode.toUpperCase()} mode`);
      
      // Use finalQuestions instead of processedQuestions for the session
      const session: QuizSession = {
        id: Date.now().toString(),
        mode: mode as any,
        category,
        difficulty: difficultyLevel,
        questions: finalQuestions, // Use filtered questions to prevent repeats
        currentQuestionIndex: 0,
        score: 0,
        lives: mode === 'survival' ? 3 : 1,
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date(),
        accuracy: 0,
        totalTimeUsed: 0,
        bonusMultiplier: 1,
        levelProgression: 0
      };

      setCurrentSession(session);
      setTimeLeft(session.questions[0]?.timeLimit || (mode === 'speed' ? 10 : 30));
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

      toast.success(`Started ${mode.toUpperCase()} mode with ${processedQuestions.length} questions!`);

    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error(`Failed to generate ${mode} quiz. AI generation required - please try again.`);
      return; // Don't create a session with mock data
    }
  };

  const handleQuizFromFiles = (quiz: any) => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      toast.error('No valid questions generated from files');
      return;
    }    const session: QuizSession = {
      id: Date.now().toString(),
      mode: selectedGameMode as any,
      category: 'Uploaded Content',
      difficulty: 'adaptive',      questions: quiz.questions.map((q: any) => ({
        ...q,
        explanation: q.explanation || `This question tests your knowledge about the uploaded content.`,
        points: q.points || 100,
        timeLimit: q.timeLimit || 30,
        difficulty: q.difficulty || 'Medium',
        category: q.category || 'General'
      })),
      currentQuestionIndex: 0,
      score: 0,
      lives: selectedGameMode === 'survival' ? 3 : 1,
      timeRemaining: 0,
      streak: 0,
      powerUps: [],
      startTime: new Date(),
      accuracy: 0,
      totalTimeUsed: 0,
      bonusMultiplier: 1,
      levelProgression: 0
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

    toast.success(`Generated ${quiz.questions.length} questions from your files!`);
  };

  const openDocumentUploader = (mode: string) => {
    setSelectedGameMode(mode);
    setShowDocumentUploader(true);
  };  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentSession) return;
    
    setSelectedAnswer(answerIndex);
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    if (soundEnabled) {
      playSound(isCorrect ? 'correct' : 'wrong');
    }

    if (isCorrect) {
      let points = question.points;
      
      // Apply lightning mode bonus for fast answers
      if (lightningMode && timeLeft > question.timeLimit * 0.7) {
        points *= 1.5;
        toast.success(`⚡ Lightning bonus! +${Math.round(points * 0.5)} extra points!`);
      }
      
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
      
      // Check for level up based on score/XP
      const levelUpResult = checkLevelUp(newScore, playerStats.level);
      if (levelUpResult.levelUp) {
        setPlayerStats(prev => ({
          ...prev,
          level: levelUpResult.newLevel,
          xp: newScore
        }));
        toast.success(`🎉 Level Up! You're now level ${levelUpResult.newLevel}!`);
        if (soundEnabled) {
          playSound('level-up');
        }
      }
      
      if (!activePowerUps.doublePoints && !lightningMode) {
        toast.success(`+${points} points!`);
      }
    } else {
      // Check if shield is active to protect from wrong answer
      if (shieldActive) {
        setShieldActive(false);
        toast.success(`🛡️ Shield protected you from losing a life!`);
        if (soundEnabled) {
          playSound('shield');
        }
      } else {
        const newLives = currentSession.lives - 1;
        setCurrentSession(prev => prev ? {
          ...prev,
          lives: newLives,
          streak: 0
        } : null);
        
        if (newLives <= 0 && currentSession.mode === 'survival') {
          // Show explanation before ending quiz
          setTimeout(() => {
            setShowExplanation(true);
          }, 1000);
          setTimeout(() => {
            endQuiz();
          }, 5000); // Give more time to read explanation
          return;
        }
      }
    }

    // Always show explanation after answer selection with fallback
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);

    // Move to next question after showing explanation
    setTimeout(() => {
      nextQuestion();
    }, 5000); // Increased time to ensure explanation is read
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
    
    const newLives = currentSession.lives - 1;
    setCurrentSession(prev => prev ? {
      ...prev,
      lives: newLives,
      streak: 0
    } : null);
    
    toast.error('Time\'s up!');
    
    if (newLives <= 0 && currentSession.mode === 'survival') {
      endQuiz();
      return;
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };
  const updateUserCoins = async (newCoinBalance: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/learning-stats`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizStats: {
            coins: newCoinBalance
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update coins');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating coins:', error);
      throw error;
    }
  };

  const usePowerUp = async (powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp || !powerUp.available || playerStats.coins < powerUp.cost) {
      toast.error('Cannot use this power-up');
      return;
    }

    try {
      const newCoinBalance = playerStats.coins - powerUp.cost;
      
      // Update coins in backend first
      await updateUserCoins(newCoinBalance);
      
      // Update local state
      setPlayerStats(prev => ({
        ...prev,
        coins: newCoinBalance
      }));      // Apply power-up effects
      switch (powerUp.type) {
        case 'time_freeze':
          setTimeLeft(prev => prev + 10);
          toast.success('Time frozen for 10 seconds! ❄️');
          break;
        case 'fifty_fifty':
          if (currentSession && currentSession.questions.length > 0) {
            const currentQ = currentSession.questions[currentSession.currentQuestionIndex];
            if (currentQ && !activePowerUps.usedFiftyFiftyQuestions.has(currentQ.id)) {
              setActivePowerUps(prev => ({
                ...prev,
                fiftyFifty: true,
                usedFiftyFiftyQuestions: new Set([...prev.usedFiftyFiftyQuestions, currentQ.id])
              }));
              toast.success('2 wrong answers removed! ✂️');
            } else {
              toast.error('50/50 already used on this question!');
              return; // Don't consume the power-up
            }
          }
          break;
        case 'extra_life':
          if (currentSession) {
            setCurrentSession(prev => prev ? {
              ...prev,
              lives: prev.lives + 1
            } : null);
          }
          toast.success('Extra life gained! ❤️');
          break;
        case 'double_points':
          setActivePowerUps(prev => ({
            ...prev,
            doublePoints: true
          }));
          toast.success('Double points for next question! 💎');
          break;        case 'hint':
          if (currentSession && currentSession.questions.length > 0) {
            const currentQ = currentSession.questions[currentSession.currentQuestionIndex];
            if (currentQ) {
              // Generate a smart hint based on the question category
              const hints = {
                'javascript': 'Think about JavaScript syntax and built-in methods',
                'react': 'Consider component lifecycle and state management',
                'algorithms': 'Focus on time complexity and data structures',
                'python': 'Remember Python-specific features and libraries',
                'databases': 'Think about SQL operations and database design',
                'general': 'Look for keywords that indicate the correct approach'
              };
              const hint = hints[currentQ.category as keyof typeof hints] || hints.general;
              toast.success(`💡 Hint: ${hint}`);
            }
          }
          break;
        case 'shield':
          setShieldActive(true);
          toast.success('🛡️ Answer Shield activated! Next wrong answer won\'t cost a life!');
          break;
        case 'lightning':
          setLightningMode(true);
          toast.success('⚡ Lightning Mode activated! Fast answers give bonus points!');
          // Auto-disable after 5 questions
          setTimeout(() => {
            setLightningMode(false);
            toast.success('Lightning Mode expired');
          }, 30000); // 30 seconds or next few questions
          break;
        case 'wisdom':
          if (currentSession && currentSession.questions.length > 0) {
            const currentQ = currentSession.questions[currentSession.currentQuestionIndex];
            if (currentQ) {
              const difficultyColors = {
                'Easy': 'text-green-400',
                'Medium': 'text-yellow-400',
                'Hard': 'text-orange-400',
                'Expert': 'text-red-400',
                'Master': 'text-purple-400'
              };
              const colorClass = difficultyColors[currentQ.difficulty as keyof typeof difficultyColors] || 'text-blue-400';
              toast.success(`🔮 Wisdom reveals: ${currentQ.difficulty} difficulty (${currentQ.difficultyRating}/10) in ${currentQ.category}`);
            }
          }
          break;
      }

      if (soundEnabled) {
        playSound('powerup');
      }
    } catch (error) {
      toast.error('Failed to use power-up. Please try again.');
      console.error('Error using power-up:', error);
    }
  };
  const recordQuizCompletion = async (session: QuizSession) => {
    try {
      const timeTaken = Math.round((Date.now() - session.startTime.getTime()) / 1000); // in seconds
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
          correctAnswers: Math.floor(session.score / 10), // Estimate based on 10 points per correct answer
          timeTaken,
          streak: session.streak
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

  const endQuiz = () => {
    if (currentSession) {
      recordQuizCompletion(currentSession);
    }
    setGameMode('results');
    if (soundEnabled) {
      playSound('game-end');
    }
  };  const playSound = (type: string) => {
    if (!soundEnabled) return;
    
    try {
      // Create audio context and play sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Define frequencies for different sound types
      const soundMap = {
        'correct': 800,
        'wrong': 400,
        'game-start': 600,
        'game-end': 300,
        'powerup': 1000,
        'level-up': 1200,
        'shield': 700,
        'lightning': 1500,
        'achievement': 900
      };
      
      const frequency = soundMap[type as keyof typeof soundMap] || 500;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type === 'level-up' ? 'square' : type === 'lightning' ? 'sawtooth' : 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      
      // Special effects for different sounds
      if (type === 'level-up' || type === 'achievement') {
        // Play a pleasant ascending sound for level up
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        oscillator.stop(audioContext.currentTime + 0.8);
      } else if (type === 'lightning') {
        // Quick burst for lightning
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
      
      oscillator.start(audioContext.currentTime);
      
      console.log(`🔊 Playing sound: ${type}`);
    } catch (error) {
      console.log(`🔇 Sound not available: ${type}`, error);
    }
  };
  const resetQuiz = () => {
    setCurrentSession(null);
    setGameMode('menu');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(0);
  };

  const clearQuestionHistory = () => {
    const userId = user?.id;
    if (userId) {
      localStorage.removeItem(`quiz_history_${userId}`);
      setQuestionHistory(new Set());
      toast.success('Question history cleared! You can now see all questions again.');
      console.log('🗑️ Question history cleared');
    }
  };

  const getCurrentQuestion = () => {
    if (!currentSession) return null;
    return currentSession.questions[currentSession.currentQuestionIndex];
  };

  const handleCreateRoom = () => {
    if (!socket) return;

    socket.emit('create_room', { userId: user?.id }, (response: any) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setIsHost(true);
        toast.success(`Room created! Code: ${response.roomCode}`);
      } else {
        toast.error('Failed to create room. Please try again.');
      }
    });
  };

  const handleJoinRoom = (code: string) => {
    if (!socket) return;

    socket.emit('join_room', { userId: user?.id, roomCode: code }, (response: any) => {
      if (response.success) {
        setRoomCode(code);
        setIsHost(false);
        toast.success(`Joined room: ${code}`);
      } else {
        toast.error('Failed to join room. Please check the code and try again.');
      }
    });
  };

  const handleLeaveRoom = () => {
    if (!socket) return;

    socket.emit('leave_room', { userId: user?.id, roomCode }, (response: any) => {
      if (response.success) {
        setRoomCode('');
        setIsHost(false);
        toast.success('Left the room');
      } else {
        toast.error('Failed to leave the room. Please try again.');
      }
    });
  };
  const handleStartMultiplayerQuiz = (category: string, mode: string) => {
    if (!socket) return;

    socket.emit('start_quiz', { userId: user?.id, roomCode, category, mode }, (response: any) => {
      if (response.success) {
        const { questions } = response;        const session: QuizSession = {
          id: Date.now().toString(),
          mode: mode as any,
          category,
          difficulty: 'adaptive',          questions: questions.map((q: any) => ({
            ...q,
            explanation: q.explanation || `This question tests your knowledge about ${getCategoryDisplayName(category) || 'programming'} concepts.`,
            points: q.points || 100,
            timeLimit: q.timeLimit || 30,
            difficulty: q.difficulty || 'Medium',
            category: getCategoryDisplayName(category) || 'Programming'
          })),
          currentQuestionIndex: 0,
          score: 0,
          lives: mode === 'survival' ? 3 : 1,
          timeRemaining: 0,
          streak: 0,
          powerUps: [],
          startTime: new Date(),
          accuracy: 0,
          totalTimeUsed: 0,
          bonusMultiplier: 1,
          levelProgression: 0
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
      } else {
        toast.error('Failed to start quiz. Please try again.');
      }
    });
  };
  // New multiplayer queue functions
  const joinMultiplayerQueue = (categoryId: string, difficulty: string) => {
    if (!socket || !user) {
      toast.error("Connection error. Please try again.");
      return;
    }
    
    // Get the selected quiz type (default to 'general' if none selected)
    const quizType = localStorage.getItem('selectedQuizType') || 'general';
    
    // Get recent questions to prevent repeats (limited to last 50)
    const recentQuestions = Array.from(questionHistory).slice(-50);
    
    socket.emit('join-multiplayer-queue', {
      playerId: user.id,
      playerName: user.name,
      category: categoryId,
      difficulty,
      quizType, // Send the quiz type to the server
      previousQuestions: recentQuestions // Send question history to prevent repeats
    });

    setMultiplayerState(prev => ({
      ...prev,
      inQueue: true
    }));
    
    const quizTypeNames: {[key: string]: string} = {
      'general': 'General Knowledge',
      'coding': 'Coding Challenge',
      'trivia': 'Tech Trivia',
      'puzzle': 'Logic Puzzles'
    };
    
    toast.success(`Joining ${quizTypeNames[quizType]} multiplayer queue...`);
  };
  const leaveMultiplayerQueue = () => {
    if (!socket) return;
    
    socket.emit('leave-queue');
    setMultiplayerState({
      inQueue: false,
      gameFound: false,
      roomId: null,
      opponent: null,
      gameStarted: false,
      opponentScore: 0,
      opponentAnswered: false,
      serverResultsReceived: false
    });

    toast.success('Left multiplayer queue');
  };
  // Handle multiplayer answer submission
  const handleMultiplayerAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentSession || !socket || !multiplayerState.roomId) return;
    
    setSelectedAnswer(answerIndex);
    const question = currentSession.questions[currentSession.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Improved multiplayer sound handling with delay and better error handling
    if (soundEnabled) {
      setTimeout(() => {
        try {
          playSound(isCorrect ? 'correct' : 'wrong');
          console.log(`🔊 Multiplayer sound played: ${isCorrect ? 'correct' : 'wrong'}`);
        } catch (error) {
          console.log('Multiplayer sound failed:', error);
          // Fallback: try to play a simple beep
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(isCorrect ? 800 : 400, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (fallbackError) {
            console.log('Fallback sound also failed:', fallbackError);
          }
        }
      }, 150); // Slight delay to ensure state is properly set
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
      
      // Apply lightning mode bonus for fast answers (same as single player)
      if (lightningMode && timeLeft > question.timeLimit * 0.7) {
        points *= 1.5;
        toast.success(`⚡ Lightning bonus! +${Math.round(points * 0.5)} extra points!`);
      }
      
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
      
      // Check for level up in multiplayer too
      const levelUpResult = checkLevelUp(newScore, playerStats.level);
      if (levelUpResult.levelUp) {
        setPlayerStats(prev => ({
          ...prev,
          level: levelUpResult.newLevel,
          xp: newScore
        }));
        toast.success(`🎉 Level Up! You're now level ${levelUpResult.newLevel}!`);
        if (soundEnabled) {
          playSound('level-up');
        }
      }
      
      if (!activePowerUps.doublePoints && !lightningMode) {
        toast.success(`+${points} points!`);
      }
    } else {
      // Check if shield is active to protect from wrong answer in multiplayer
      if (shieldActive) {
        setShieldActive(false);
        toast.success(`🛡️ Shield protected you from penalty!`);
        if (soundEnabled) {
          playSound('shield');
        }
      } else {
        setCurrentSession(prev => prev ? {
          ...prev,
          streak: 0
        } : null);
      }
    }

    // Show explanation immediately for multiplayer with fallback
    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);
  };
  useEffect(() => {
    if (!socket) return;

    socket.on('room_data', (data: any) => {
      setConnectedUsers(data.connectedUsers);
      setMultiplayerData(data);
    });    socket.on('quiz_started', (data: any) => {
      const { questions, mode } = data;      const session: QuizSession = {
        id: Date.now().toString(),
        mode: mode as any,
        category: 'Multiplayer',
        difficulty: 'adaptive',        questions: questions.map((q: any) => ({
          ...q,
          explanation: q.explanation || generateDetailedExplanation(q),
          points: q.points || calculateQuestionPoints(q.difficulty || 'Medium', mode),
          timeLimit: q.timeLimit || 30,
          difficulty: q.difficulty || 'Medium',
          difficultyRating: q.difficultyRating || calculateDifficultyRating(q.difficulty || 'Medium'),
          category: q.category || 'Multiplayer'
        })),
        currentQuestionIndex: 0,
        score: 0,
        lives: mode === 'survival' ? 3 : 1,
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date(),
        accuracy: 0,
        totalTimeUsed: 0,
        bonusMultiplier: 1,
        levelProgression: 0
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
    });    // Multiplayer queue and game events
    socket.on('queue-status', (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        inQueue: data.status === 'waiting'
      }));
      toast.success(data.message);
    });

    socket.on('game-found', (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        inQueue: false,
        gameFound: true,
        roomId: data.roomId,
        opponent: data.opponent
      }));
        // Start the multiplayer game
      const session: QuizSession = {
        id: data.roomId,
        mode: 'multiplayer',
        category: data.category,
        difficulty: data.difficulty,        questions: data.questions.map((q: any) => ({
          ...q,
          explanation: q.explanation || `This question tests your knowledge about ${getCategoryDisplayName(data.category) || 'programming'} concepts.`,
          points: q.points || calculateQuestionPoints(q.difficulty || 'Medium', 'multiplayer'),
          timeLimit: q.timeLimit || 30,
          difficultyRating: q.difficultyRating || calculateDifficultyRating(q.difficulty || 'Medium'),
          difficulty: q.difficulty || 'Medium',
          category: getCategoryDisplayName(data.category) || 'Programming'
        })),
        currentQuestionIndex: 0,
        score: 0,
        lives: 1,
        timeRemaining: 0,
        streak: 0,
        powerUps: [],
        startTime: new Date(),
        accuracy: 0,
        totalTimeUsed: 0,
        bonusMultiplier: 1,
        levelProgression: 0
      };
        setCurrentSession(session);
      setTimeLeft(session.questions[0]?.timeLimit || 30);
      setGameMode('playing');
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      // Save questions to history to prevent repetition
      const newQuestionIds = session.questions.map(q => q.id).filter(id => id && !questionHistory.has(id));
      if (newQuestionIds.length > 0) {
        setQuestionHistory(prev => new Set([...prev, ...newQuestionIds]));
        console.log(`📚 Added ${newQuestionIds.length} new questions to history`);
      }
      
      toast.success(`Game found! Playing against ${data.opponent.name}`);
    });

    socket.on('opponent-answered', (data: any) => {
      setMultiplayerState(prev => ({
        ...prev,
        opponentAnswered: true
      }));
    });    socket.on('question-results', (data: any) => {
      const { results, correctAnswer, explanation } = data;
      const myResult = results.find((r: any) => r.playerId === user?.id);
      const opponentResult = results.find((r: any) => r.playerId !== user?.id);
      
      // Update our session with the correct score from server
      if (myResult && currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          score: myResult.totalScore,
          streak: myResult.isCorrect ? prev.streak + 1 : 0
        } : null);
      }
        // Update multiplayer state with opponent info and server results flag
      setMultiplayerState(prev => ({
        ...prev,
        opponentScore: opponentResult?.totalScore || 0,
        opponentAnswered: false,
        serverResultsReceived: true
      }));

      // Show result feedback with explanation
      if (myResult) {
        const message = myResult.isCorrect 
          ? `✅ Correct! +${myResult.points} points`
          : `❌ Wrong. Correct answer: ${String.fromCharCode(65 + correctAnswer)}`;
        toast.success(message);
      }

      // Force show explanation for multiplayer
      setTimeout(() => {
        setShowExplanation(true);
      }, 500);
    });    socket.on('next-question', (data: any) => {
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          currentQuestionIndex: data.questionIndex
        } : null);        setSelectedAnswer(null);
        setShowExplanation(false);
        setTimeLeft(data.question.timeLimit || 30);
        
        // Reset server results flag for new question
        setMultiplayerState(prev => ({
          ...prev,
          serverResultsReceived: false
        }));
        
        // Reset any active power-ups for the new question
        setActivePowerUps(prev => ({
          ...prev,
          doublePoints: false // Reset double points for new question
        }));
      }
    });socket.on('game-finished', (data: any) => {
      setGameMode('results');
      
      if (data.tie) {
        toast.success('🤝 It\'s a tie! Great game!');
      } else if (data.winner) {
        const isWinner = data.winner.playerId === user?.id;
        toast.success(isWinner ? '🎉 You won the battle!' : `🏆 ${data.winner.playerName} wins! Good game!`);
      } else {
        toast.success('Game completed!');
      }
      
      // Update final session with multiplayer results
      if (currentSession) {
        setCurrentSession(prev => prev ? {
          ...prev,
          score: data.players.find((p: any) => p.playerId === user?.id)?.score || prev.score
        } : null);
      }
        // Reset multiplayer state
      setMultiplayerState({
        inQueue: false,
        gameFound: false,
        roomId: null,
        opponent: null,
        gameStarted: false,
        opponentScore: 0,
        opponentAnswered: false,
        serverResultsReceived: false
      });
    });

    socket.on('opponent-disconnected', () => {
      toast.success('Your opponent disconnected. You win!');
      setGameMode('results');
      setMultiplayerState({
        inQueue: false,
        gameFound: false,        roomId: null,
        opponent: null,
        gameStarted: false,
        opponentScore: 0,
        opponentAnswered: false,
        serverResultsReceived: false
      });
    });

    socket.on('game-error', (data: any) => {
      toast.error(data.message);      setMultiplayerState({
        inQueue: false,
        gameFound: false,
        roomId: null,
        opponent: null,
        gameStarted: false,
        opponentScore: 0,
        opponentAnswered: false,
        serverResultsReceived: false
      });
    });

    return () => {
      socket.off('room_data');
      socket.off('quiz_started');
      socket.off('quiz_ended');
      socket.off('queue-status');
      socket.off('game-found');
      socket.off('opponent-answered');
      socket.off('question-results');
      socket.off('next-question');
      socket.off('game-finished');
      socket.off('opponent-disconnected');
      socket.off('game-error');
    };
  }, [socket, soundEnabled, currentSession, user]);

  // Generate better explanations for questions with missing explanations
  const generateDetailedExplanation = (question: any): string => {
    const { category, correctAnswer, options } = question;
    const correctOption = options[correctAnswer];
    
    // Get category display name
    const categoryName = getCategoryDisplayName(category);
    
    // Get the quiz type
    const quizType = localStorage.getItem('selectedQuizType') || 'general';
    const quizTypeNames: {[key: string]: string} = {
      'general': 'general knowledge',
      'coding': 'programming concepts',
      'trivia': 'tech trivia',
      'puzzle': 'logical reasoning'
    };
    
    // Create contextual explanations based on category and quiz type
    const explanations: {[key: string]: string} = {
      'javascript': `This JavaScript question tests your understanding of ${quizTypeNames[quizType]} in JavaScript. The correct answer "${correctOption}" demonstrates proper usage of JavaScript syntax and concepts.`,
      'react': `In React development, "${correctOption}" is the correct approach because React components follow specific patterns for state management and rendering.`,
      'algorithms': `In algorithm design, "${correctOption}" provides the optimal solution in terms of time and space complexity for this particular problem.`,
      'databases': `For database operations, "${correctOption}" follows best practices for data integrity and query optimization.`,
      'python': `In Python programming, "${correctOption}" is correct because Python's syntax and libraries are designed to handle this scenario efficiently.`,
      'security': `From a cybersecurity perspective, "${correctOption}" offers the most secure approach to protect against common vulnerabilities.`,
      'ai': `In artificial intelligence concepts, "${correctOption}" correctly applies principles of machine learning and neural networks.`,
      'webdev': `For web development, "${correctOption}" follows modern best practices for responsive design and user experience.`,
      'default': `The correct answer is "${correctOption}". This tests your knowledge of ${categoryName} ${quizTypeNames[quizType]}.`
    };
    
    return explanations[category] || explanations.default;
  };
  if (gameMode === 'results' && currentSession) {
    return (
      <AppLayout pageTitle="Quiz Results">
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="text-center bg-white/10 backdrop-blur border-white/20 text-white">
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
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-80">Final Score</p>
                    <p className="text-2xl font-bold">{currentSession.score}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-80">Best Streak</p>
                    <p className="text-2xl font-bold">{currentSession.streak}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-80">Accuracy</p>
                    <p className="text-2xl font-bold">
                      {Math.round((currentSession.score / (currentSession.questions.length * 100)) * 100)}%
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-80">Time Taken</p>
                    <p className="text-2xl font-bold">
                      {Math.round((Date.now() - currentSession.startTime.getTime()) / 60000)}m
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={resetQuiz} className="w-full bg-purple-600 hover:bg-purple-700">
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

  if (gameMode === 'playing' && currentSession) {
    const question = getCurrentQuestion();
    if (!question) return null;

    return (
      <AppLayout pageTitle="Quiz Arena - Playing">
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
          
          {/* Game HUD */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-4 text-white">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold">{currentSession.score}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span>Streak: {currentSession.streak}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Lives:</span>
                  {Array.from({ length: currentSession.lives }).map((_, i) => (
                    <span key={i} className="text-red-400">❤️</span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : ''}`}>
                    {timeLeft}s
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-white hover:bg-white/20"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentSession.currentQuestionIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >              <Card className="bg-white/10 backdrop-blur border-white/20 text-white mb-6">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between">
                    <Badge className="bg-purple-600 mb-2">
                      Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                    </Badge>
                    <div className="flex items-center space-x-2 mb-2">
                      {/* Display difficulty level */}
                      <Badge 
                        className={`${
                          question.difficulty === 'Easy' ? 'bg-green-600' : 
                          question.difficulty === 'Medium' ? 'bg-blue-600' : 
                          question.difficulty === 'Hard' ? 'bg-orange-600' : 
                          question.difficulty === 'Expert' ? 'bg-red-600' : 'bg-purple-800'
                        }`}
                      >
                        {question.difficulty}
                      </Badge>
                      
                      {/* Display points */}
                      <Badge variant="outline" className="border-white/30 text-white">
                        {question.points} points
                      </Badge>
                      
                      {/* Display difficulty rating (like LeetCode) */}
                      <Badge variant="outline" className="border-yellow-300/30 text-yellow-300">
                        Difficulty: {question.difficultyRating}/10
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Display streak information */}
                  {currentSession.streak > 0 && (
                    <div className="bg-orange-500/20 rounded-md px-3 py-1 mt-2 mb-3 inline-flex items-center">
                      <Flame className="h-4 w-4 text-orange-400 mr-2" />
                      <span className="text-sm font-medium text-orange-300">
                        {currentSession.streak} Question Streak!
                      </span>
                    </div>
                  )}
                  
                  <CardTitle className="text-xl mt-4">{question.question}</CardTitle>
                </CardHeader>
              </Card>{/* Answer Options */}
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
                    }                  }                    let buttonClass = 'bg-white/10 hover:bg-white/20 border-white/30 text-white';
                  
                  if (showResult) {
                    if (currentSession?.mode === 'multiplayer') {
                      // In multiplayer, only highlight selected answer until server response
                      if (isSelected) {
                        buttonClass = multiplayerState.serverResultsReceived
                          ? (isCorrect ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white')
                          : 'bg-blue-500 border-blue-400 text-white'; // Pending state
                      } else if (isCorrect && multiplayerState.serverResultsReceived) {
                        // Only show correct answer after server confirms
                        buttonClass = 'bg-green-500/40 border-green-400/40 text-green-100';
                      }
                    } else {
                      // Single-player logic - improved highlighting
                      if (isCorrect) {
                        buttonClass = 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25';
                      } else if (isSelected) {
                        buttonClass = 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/25';
                      } else {
                        buttonClass = 'bg-white/5 border-white/20 text-white/60';
                      }
                    }
                  }
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                      whileTap={{ scale: 0.98 }}
                    >                      <Button
                        variant="outline"
                        className={`w-full h-auto p-4 text-left justify-start ${buttonClass}`}
                        onClick={() => {
                          if (currentSession?.mode === 'multiplayer') {
                            handleMultiplayerAnswerSelect(index); 
                          } else {
                            handleAnswerSelect(index);
                          }
                        }}
                        disabled={selectedAnswer !== null}
                      >
                        <span className="font-bold mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-blue-500/20 backdrop-blur border-blue-400/30 text-white">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Brain className="h-4 w-4" />
                          </div>                          <div>
                            <h4 className="font-semibold mb-2">Explanation</h4>
                            <p className="text-blue-100">
                              {question.explanation && question.explanation.trim() !== '' 
                                ? question.explanation 
                                : 'This question helps test your understanding of the topic. Review the correct answer and continue learning!'
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>          {/* Power-ups */}
          <div className="fixed bottom-6 left-6 right-6">
            <div className="max-w-4xl mx-auto">
              {/* Active Power-ups Indicators */}
              {(activePowerUps.doublePoints || activePowerUps.usedFiftyFiftyQuestions.has(currentSession?.questions[currentSession.currentQuestionIndex]?.id || '')) && (
                <div className="mb-2 flex justify-center space-x-2">
                  {activePowerUps.doublePoints && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-yellow-500/20 backdrop-blur border border-yellow-400 rounded-lg px-3 py-1 text-yellow-300 text-sm font-medium"
                    >
                      💎 Double Points Active
                    </motion.div>
                  )}
                  {currentSession && activePowerUps.usedFiftyFiftyQuestions.has(currentSession.questions[currentSession.currentQuestionIndex]?.id || '') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-blue-500/20 backdrop-blur border border-blue-400 rounded-lg px-3 py-1 text-blue-300 text-sm font-medium"                    >
                      ✂️ 50/50 Applied
                    </motion.div>
                  )}
                </div>
              )}

              {/* Power-ups */}
              <div className="flex justify-center space-x-2">
                {powerUps.filter(p => p.available && playerStats.coins >= p.cost).map(powerUp => (
                  <motion.button
                    key={powerUp.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => usePowerUp(powerUp.id)}
                    className="bg-white/20 backdrop-blur border border-white/30 rounded-lg p-3 text-white hover:bg-white/30 transition-colors"
                    disabled={selectedAnswer !== null}
                  >
                    <div className="text-xl mb-1">{powerUp.icon}</div>
                    <div className="text-xs font-medium">{powerUp.cost} coins</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Multiplayer UI for when in multiplayer mode */}
          {currentSession?.mode === 'multiplayer' && multiplayerState.opponent && (
            <div className="fixed top-20 right-6 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 text-white">
              <div className="text-sm font-medium mb-2">Opponent: {multiplayerState.opponent.name}</div>
              <div className="text-xs opacity-80">Score: {multiplayerState.opponentScore}</div>
              {multiplayerState.opponentAnswered && (
                <div className="text-xs text-green-400 mt-1">✓ Answered</div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Main Menu
  return (
    <AppLayout pageTitle="AI Quiz Arena">
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        
        {/* Connection Status */}
        {showConnectionError && (
          <div className="fixed top-4 right-4 bg-red-500/20 backdrop-blur border border-red-400 rounded-lg p-3 text-red-300 text-sm">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span>Connection lost. Reconnecting...</span>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="fixed top-4 right-4 bg-green-500/20 backdrop-blur border border-green-400 rounded-lg p-3 text-green-300 text-sm">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-4"
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white">AI Quiz Arena</h1>
            </div>
            <p className="text-xl text-purple-200">
              Challenge yourself with AI-powered quizzes and compete with others!
            </p>
          </motion.div>

          {/* Player Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Player Statistics</span>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    <span>Level {playerStats.level}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{playerStats.coins}</div>
                    <div className="text-sm opacity-80">Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{playerStats.xp}</div>
                    <div className="text-sm opacity-80">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{playerStats.correctAnswers}</div>
                    <div className="text-sm opacity-80">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{playerStats.bestStreak}</div>
                    <div className="text-sm opacity-80">Best Streak</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to Level {playerStats.level + 1}</span>
                    <span>{playerStats.xp % 100}/100</span>
                  </div>
                  <Progress value={(playerStats.xp % 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Multiplayer Queue Status */}
          {multiplayerState.inQueue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-yellow-500/20 backdrop-blur border-yellow-400/30 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Users className="h-6 w-6 text-yellow-400" />
                      </motion.div>
                      <div>
                        <div className="font-semibold">Searching for opponent...</div>
                        <div className="text-sm opacity-80">This might take a moment</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={leaveMultiplayerQueue}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Modes */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gamepad2 className="h-5 w-5 mr-2" />
                      Choose Your Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">                      {/* Battle Arena - Multiplayer */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="border border-purple-400/30 rounded-lg p-4 cursor-pointer hover:bg-purple-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Sword className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Battle Arena</h3>
                            <p className="text-sm opacity-80">8 competitive questions • Real-time PvP • Skill matching</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className="bg-purple-600 text-xs">Strategic Power-ups</Badge>
                              <Badge className="bg-purple-600 text-xs">Live Competition</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-purple-600">Multiplayer</Badge>
                      </div>
                        {!multiplayerState.inQueue ? (
                        <div className="space-y-3">
                          {/* Quiz Type Selection for Battle Arena - New! */}
                          <div className="border border-purple-300/30 rounded-lg p-3 bg-purple-500/10">
                            <h4 className="text-sm font-semibold mb-2 text-purple-200">Quiz Type:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {[
                                { id: 'general', name: 'General Knowledge', icon: '🌍' },
                                { id: 'coding', name: 'Coding Challenge', icon: '💻' },
                                { id: 'trivia', name: 'Tech Trivia', icon: '🧠' },
                                { id: 'puzzle', name: 'Logic Puzzles', icon: '🧩' }
                              ].map(quizType => (
                                <Button
                                  key={quizType.id}
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-300/30 text-purple-200 hover:bg-purple-500/20 text-xs"
                                  onClick={() => {
                                    // Store the selected quiz type
                                    localStorage.setItem('selectedQuizType', quizType.id);
                                    toast.success(`Selected: ${quizType.name} quiz`);
                                  }}
                                >
                                  {quizType.icon} {quizType.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categories.map(category => (
                              <div key={category.id} className="space-y-2">
                                <div className="text-sm font-medium">{category.name}</div>
                                <div className="flex space-x-1">
                                  {['Easy', 'Medium', 'Hard'].map(difficulty => (
                                    <Button
                                      key={difficulty}
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs border-white/30 text-white hover:bg-white/20"
                                      onClick={() => joinMultiplayerQueue(category.id, difficulty.toLowerCase())}
                                    >
                                      {difficulty}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-yellow-400">Searching for opponent...</div>
                        </div>
                      )}
                    </motion.div>                    {/* Classic Mode */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="border border-blue-400/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Brain className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Classic Mode</h3>
                            <p className="text-sm opacity-80">10 balanced questions • 30s each • Educational focus</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="border-blue-300/30 text-blue-300 text-xs">All Power-ups</Badge>
                              <Badge variant="outline" className="border-blue-300/30 text-blue-300 text-xs">Educational</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white">Single Player</Badge>
                      </div>                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map(category => (
                          <Button
                            key={category.id}
                            variant="outline"
                            size="sm"
                            className={`border-white/30 text-white hover:bg-white/20 bg-gradient-to-r ${category.color} border-transparent`}
                            onClick={() => startQuiz(category.id, 'classic')}
                          >
                            {category.icon} {category.name}
                          </Button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Speed Round */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="border border-orange-400/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Speed Round</h3>
                            <p className="text-sm opacity-80">15 rapid-fire questions • 10s each • Quick recall</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="border-orange-300/30 text-orange-300 text-xs">Time Freeze+</Badge>
                              <Badge variant="outline" className="border-orange-300/30 text-orange-300 text-xs">Fast Pace</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white">10s per Q</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">                        {categories.map(category => (
                          <Button
                            key={category.id}
                            variant="outline"
                            size="sm"
                            className={`border-white/30 text-white hover:bg-white/20 bg-gradient-to-r ${category.color} border-transparent`}
                            onClick={() => startQuiz(category.id, 'speed')}
                          >
                            {category.icon} {category.name}
                          </Button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Survival Mode */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="border border-red-400/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Survival Mode</h3>
                            <p className="text-sm opacity-80">50 escalating questions • 3 lives • Progressive difficulty</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="border-red-300/30 text-red-300 text-xs">Extra Life</Badge>
                              <Badge variant="outline" className="border-red-300/30 text-red-300 text-xs">High Stakes</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white">3 Lives</Badge>
                      </div>                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map(category => (
                          <Button
                            key={category.id}
                            variant="outline"
                            size="sm"
                            className={`border-white/30 text-white hover:bg-white/20 bg-gradient-to-r ${category.color} border-transparent`}
                            onClick={() => startQuiz(category.id, 'survival')}
                          >
                            {category.icon} {category.name}
                          </Button>
                        ))}
                      </div>
                    </motion.div>                    {/* Upload Content */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="border border-green-400/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <Upload className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Custom Content</h3>
                            <p className="text-sm opacity-80">Upload files • AI generates unique questions • All modes available</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="border-green-300/30 text-green-300 text-xs">AI Generated</Badge>
                              <Badge variant="outline" className="border-green-300/30 text-green-300 text-xs">Your Content</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white">PDF/DOCX</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['classic', 'speed', 'survival'].map(mode => (
                          <Button
                            key={mode}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/20 capitalize"
                            onClick={() => openDocumentUploader(mode)}
                          >
                            {mode} Mode
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>            {/* Sidebar */}
            <div className="space-y-6">
              {/* Settings & History */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-400" />
                      Settings & History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🔊</span>
                        <div>
                          <div className="font-medium">Sound Effects</div>
                          <div className="text-xs opacity-80">Audio feedback for answers</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`${soundEnabled ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {soundEnabled ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📚</span>
                        <div>
                          <div className="font-medium">Question History</div>
                          <div className="text-xs opacity-80">{questionHistory.size} questions completed</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearQuestionHistory}
                        className="text-yellow-400 hover:text-yellow-300"
                        disabled={questionHistory.size === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Power-ups Shop */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-400" />
                      Power-ups
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {powerUps.map(powerUp => (
                      <div
                        key={powerUp.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{powerUp.icon}</span>
                          <div>
                            <div className="font-medium">{powerUp.name}</div>
                            <div className="text-xs opacity-80">{powerUp.description}</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 font-bold">{powerUp.cost}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {achievements.slice(0, 3).map(achievement => (
                      <div
                        key={achievement.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          achievement.unlocked 
                            ? 'bg-green-500/20 border border-green-400/30' 
                            : 'bg-white/5'
                        }`}
                      >
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-xs opacity-80">{achievement.description}</div>
                          {!achievement.unlocked && (
                            <div className="mt-1">
                              <Progress 
                                value={(achievement.progress / achievement.maxProgress) * 100} 
                                className="h-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Leaderboard */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Medal className="h-5 w-5 mr-2 text-yellow-400" />
                      Global Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={entry.rank}
                        className="flex items-center justify-between p-2 bg-white/5 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
                            {entry.rank}
                          </div>
                          <span className="font-medium">{entry.username}</span>
                        </div>
                        <span className="text-yellow-400 font-bold">{entry.score}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Document Uploader Modal */}
        <AnimatePresence>
          {showDocumentUploader && (
            <DocumentUploader
              gameMode={selectedGameMode}
              onQuizGenerated={handleQuizFromFiles}
              onClose={() => setShowDocumentUploader(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default AIQuizArena;
