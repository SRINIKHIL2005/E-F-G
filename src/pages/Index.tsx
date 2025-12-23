import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, Star, Award, Trophy, Users, BookOpen, Calendar, Check, Sparkles,
  Cpu, Database, Network, Radar, Power, Binary, Terminal, Layers, Activity,
  Shield, Lock, Mail, User, Globe, FileText, Zap, Brain, Rocket, Eye, 
  ArrowRight, Play, Pause, Volume2, VolumeX, Settings, Search, Filter
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [systemOnline, setSystemOnline] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [particleSystem, setParticleSystem] = useState([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [signupHovered, setSignupHovered] = useState(false);
  const [showInitOverlay, setShowInitOverlay] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  
  // Interactive cursor and secret elements states
  const [cursorTrail, setCursorTrail] = useState([]);
  const [secretSequence, setSecretSequence] = useState([]);
  const [hiddenElementsFound, setHiddenElementsFound] = useState(new Set());
  const [accessLevel, setAccessLevel] = useState(0);
  const [showSecretPanel, setShowSecretPanel] = useState(false);
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [accessCodes, setAccessCodes] = useState([]);
  const [konami, setKonami] = useState([]);
  const [clickPattern, setClickPattern] = useState([]);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [secretMessage, setSecretMessage] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);
  
  // New: Master Access overlay state
  const [showMasterOverlay, setShowMasterOverlay] = useState(false);
  // New: Master Console visibility
  const [showMasterConsole, setShowMasterConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState('overview');
  const [systemLogs, setSystemLogs] = useState([]);
  const [consoleTheme, setConsoleTheme] = useState('dark');
  const [autoScroll, setAutoScroll] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [performanceMonitor, setPerformanceMonitor] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('standard');
  const [aiPersonality, setAiPersonality] = useState('professional');
  const [customCommands, setCustomCommands] = useState([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [networkMonitor, setNetworkMonitor] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    fps: 60,
    memory: 0,
    cpu: 0,
    network: 'online',
    uptime: 0
  });
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupData, setBackupData] = useState(null);
  const [consoleAnimations, setConsoleAnimations] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [macroCommands, setMacroCommands] = useState([]);
  const [scriptMode, setScriptMode] = useState(false);
  const [dataExport, setDataExport] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    cpu: 0,
    memory: 0,
    network: 'stable',
    errors: 0,
    warnings: 0
  });
  const [advancedMetrics, setAdvancedMetrics] = useState({
    renderTime: 0,
    animationFrames: 0,
    eventListeners: 0,
    domNodes: 0
  });
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    speed: 'unknown',
    latency: 0,
    requests: 0
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [backupSchedule, setBackupSchedule] = useState('manual');
  const [systemTheme, setSystemTheme] = useState('auto');
  const [experienceMode, setExperienceMode] = useState('enhanced');
  const [powerMode, setPowerMode] = useState('balanced');
  const [customMacros, setCustomMacros] = useState([
    { name: 'Quick Reset', command: 'reset && unlock-all' },
    { name: 'Debug Session', command: 'theme neon && performance on && security low' },
    { name: 'Production Mode', command: 'theme dark && security high && performance off' }
  ]);
  
  const containerRef = useRef(null);
  const particleIdCounter = useRef(0);
  const trailIdCounter = useRef(0);

  // Futuristic messages
  const messages = [
    'NEURAL EDUCATION MATRIX ONLINE...',
    'QUANTUM LEARNING PROTOCOLS ACTIVE...',
    'AI-POWERED FEEDBACK SYSTEMS READY...',
    'BIOMETRIC AUTHENTICATION ENABLED...',
    'WELCOME TO THE FUTURE OF EDUCATION...'
  ];

  // Enhanced color scheme
  const colors = {
    primary: '#06B6D4', // Cyan
    secondary: '#8B5CF6', // Violet
    accent: '#EC4899', // Pink
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    dark: '#0F172A' // Slate-900
  };

  // Secret puzzles and challenges
  const puzzles = [
    {
      id: 1,
      question: "What is the quantum computing principle that allows multiple states simultaneously?",
      answer: "superposition",
      reward: "ACCESS_CODE_ALPHA",
      hint: "Think parallel realities..."
    },
    {
      id: 2,
      question: "In neural networks, what connects neurons and carries weighted signals?",
      answer: "synapses",
      reward: "ACCESS_CODE_BETA",
      hint: "Biological inspiration for AI..."
    },
    {
      id: 3,
      question: "What programming paradigm treats computation as the evaluation of mathematical functions?",
      answer: "functional",
      reward: "ACCESS_CODE_GAMMA",
      hint: "Pure functions, no side effects..."
    },
    {
      id: 4,
      question: "What is the name of the encryption method that uses two mathematically related keys?",
      answer: "asymmetric",
      reward: "MASTER_ACCESS",
      hint: "Public and private dance together..."
    }
  ];

  // Secret click patterns and key sequences
  const secretPatterns = {
    fibonacci: [1, 1, 2, 3, 5], // Click pattern timing in seconds
    binary: [0, 1, 0, 1, 1, 0, 1], // Binary sequence
    secretCode: ['KeyQ', 'KeyU', 'KeyA', 'KeyN', 'KeyT', 'KeyU', 'KeyM'] // QUANTUM
  };

  // Hidden access codes
  const masterCodes = ['MATRIX_OVERRIDE', 'NEURAL_BYPASS', 'QUANTUM_UNLOCK', 'SINGULARITY_ACCESS'];

  // Features data
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Learning",
      description: "Advanced neural networks analyze learning patterns and provide personalized educational experiences.",
      color: colors.primary,
      delay: 0
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Quantum Data Analytics",
      description: "Process massive educational datasets with quantum-speed analytics for instant insights.",
      color: colors.secondary,
      delay: 0.2
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Biometric Security",
      description: "Next-generation security protocols ensure your educational data remains protected.",
      color: colors.accent,
      delay: 0.4
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Neural Networking",
      description: "Connect students, teachers, and administrators through an advanced communication matrix.",
      color: colors.success,
      delay: 0.6
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Performance Boost",
      description: "Accelerate learning outcomes with our revolutionary educational acceleration technology.",
      color: colors.warning,
      delay: 0.8
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Real-time Monitoring",
      description: "Advanced surveillance systems track learning progress with microscopic precision.",
      color: colors.danger,
      delay: 1.0
    }
  ];

  // Stats data
  const stats = [
    { number: "99.9%", text: "System Uptime", icon: <Activity size={24} />, color: colors.success },
    { number: "∞", text: "Processing Power", icon: <Cpu size={24} />, color: colors.primary },
    { number: "10K+", text: "Neural Nodes", icon: <Network size={24} />, color: colors.secondary },
    { number: "24/7", text: "AI Monitoring", icon: <Eye size={24} />, color: colors.accent }
  ];

  // System initialization sequence
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setInitProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => setShowInitOverlay(false), 500);
          setTimeout(() => {
            setSystemOnline(true);
            setShowSecretPanel(true); // Show secret panel immediately for visibility
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);
    
    return () => {
      clearInterval(progressTimer);
      clearInterval(glitchTimer);
    };
  }, []);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'hod':
          navigate('/hod/dashboard');
          break;
        default:
          break;
      }
    }
  }, [user, navigate]);

  // Particle system for background effects
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: `particle-${++particleIdCounter.current}`, // Unique incremental ID
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          size: Math.random() * 3 + 1,
          color: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent,
          char: String.fromCharCode(0x30A0 + Math.random() * 96)
        });
      }
      setParticleSystem(newParticles);
    };

    createParticles();
    const interval = setInterval(() => {
      setParticleSystem(prev => prev.map((particle, index) => ({
        ...particle,
        y: particle.y > window.innerHeight ? -20 : particle.y + particle.speed,
        opacity: Math.sin(Date.now() * 0.001 + index) * 0.3 + 0.2
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // AI typing effect for hero text
  useEffect(() => {
    if (!systemOnline) return;
    
    const currentMessage = messages[textIndex % messages.length];
    const typingInterval = setInterval(() => {
      setDisplayText(prev => {
        if (prev.length < currentMessage.length) {
          return currentMessage.slice(0, prev.length + 1);
        } else {
          setTimeout(() => {
            setDisplayText('');
            setTextIndex(prev => prev + 1);
          }, 3000);
          return prev;
        }
      });
    }, 100);

    return () => clearInterval(typingInterval);
  }, [textIndex, systemOnline]);

  // Enhanced cursor tracking with trail and secret detection
  useEffect(() => {
    let trailTimeout;
    
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = (e.clientX - rect.left - centerX) / centerX;
        const y = (e.clientY - rect.top - centerY) / centerY;
        
        setMousePosition({ x: x * 30, y: y * 30 });
        
        // Create cursor trail
        const trailPoint = {
          id: `trail-${++trailIdCounter.current}`,
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now()
        };
        
        setCursorTrail(prev => {
          const newTrail = [...prev, trailPoint].slice(-20); // Keep last 20 points
          return newTrail.filter(point => Date.now() - point.timestamp < 1000);
        });

        // Secret area detection - Made larger and more accessible
        const secretAreas = [
          { x: 0, y: 0, width: 100, height: 100, id: 'corner-tl' },
          { x: window.innerWidth - 100, y: 0, width: 100, height: 100, id: 'corner-tr' },
          { x: 0, y: window.innerHeight - 100, width: 100, height: 100, id: 'corner-bl' },
          { x: window.innerWidth - 100, y: window.innerHeight - 100, width: 100, height: 100, id: 'corner-br' }
        ];

        secretAreas.forEach(area => {
          if (e.clientX >= area.x && e.clientX <= area.x + area.width &&
              e.clientY >= area.y && e.clientY <= area.y + area.height) {
            if (!hiddenElementsFound.has(area.id)) {
              setHiddenElementsFound(prev => new Set([...prev, area.id]));
              setSecretMessage(`🎯 Hidden area discovered: ${area.id.replace('-', ' ').toUpperCase()}! Keep exploring...`);
              setTimeout(() => setSecretMessage(''), 4000);
            }
          }
        });
      }
    };

    const handleClick = (e) => {
      const now = Date.now();
      const timeDiff = now - lastClickTime;
      
      // Record click pattern
      setClickPattern(prev => {
        const newPattern = [...prev, timeDiff].slice(-10);
        
        // Check for Fibonacci sequence in timing (within 100ms tolerance)
        if (newPattern.length >= 5) {
          const normalized = newPattern.slice(-5).map(t => Math.round(t / 100));
          if (JSON.stringify(normalized) === JSON.stringify([1, 1, 2, 3, 5])) {
            triggerSecretAccess('fibonacci_pattern');
          }
        }
        
        return newPattern;
      });
      
      setLastClickTime(now);
      
      // Triple click detection on specific elements
      const target = e.target.closest('.secret-trigger');
      if (target) {
        const now = Date.now();
        if (now - lastClickTime < 500) { // Within 500ms for rapid clicks
          setSecretSequence(prev => {
            const newSeq = [...prev, 'click'].slice(-3);
            if (newSeq.length === 3 && newSeq.every(action => action === 'click')) {
              triggerPuzzle();
              return []; // Reset after successful trigger
            }
            return newSeq;
          });
        } else {
          setSecretSequence(['click']); // Reset if too much time passed
        }
        setLastClickTime(now);
      }
    };

    const handleKeyDown = (e) => {
      setKonami(prev => {
        const newSeq = [...prev, e.code].slice(-7); // QUANTUM has 7 letters
        if (JSON.stringify(newSeq) === JSON.stringify(secretPatterns.secretCode)) {
          triggerMatrixMode();
          return [];
        }
        return newSeq;
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Secret scroll pattern detection (now at 100px)
      if (window.scrollY > 100 && window.scrollY < 200) {
        if (!hiddenElementsFound.has('deep-scroll')) {
          setHiddenElementsFound(prev => new Set([...prev, 'deep-scroll']));
          setSecretMessage('Deep scroll unlocked hidden matrix layer...');
          setTimeout(() => setSecretMessage(''), 3000);
          // Trigger the puzzle modal when discovered
          triggerPuzzle();
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(trailTimeout);
    };
  }, [lastClickTime, hiddenElementsFound]);

  // Secret access triggers
  const triggerSecretAccess = (type) => {
    setAccessLevel(prev => prev + 1);
    setSecretMessage(`Access Level ${accessLevel + 1} Unlocked: ${type.replace('_', ' ').toUpperCase()}`);
    
    if (accessLevel >= 3) {
      setShowSecretPanel(true);
    }
  };

  const triggerPuzzle = () => {
    const availablePuzzles = puzzles.filter(p => !accessCodes.includes(p.reward));
    if (availablePuzzles.length > 0) {
      setCurrentPuzzle(availablePuzzles[0]);
      setPuzzleActive(true);
    }
  };

  const triggerMatrixMode = () => {
    setShowMatrix(true);
    setSecretMessage('MATRIX MODE ACTIVATED - REALITY.EXE HAS STOPPED WORKING');
    setTimeout(() => {
      setShowMatrix(false);
      setSecretMessage('');
      // Automatically trigger the puzzle modal after Matrix mode
      triggerPuzzle();
    }, 10000);
  };

  const solvePuzzle = (answer) => {
    if (currentPuzzle && answer.toLowerCase() === currentPuzzle.answer.toLowerCase()) {
      setAccessCodes(prev => [...prev, currentPuzzle.reward]);
      setSecretMessage(`Puzzle solved! Access code obtained: ${currentPuzzle.reward}`);
      setPuzzleActive(false);
      setCurrentPuzzle(null);
      triggerSecretAccess('puzzle_solved');
    } else {
      setSecretMessage('Incorrect answer. Neural pathways realigning...');
      setTimeout(() => setSecretMessage(''), 2000);
    }
  };

  // Check for master access unlock
  useEffect(() => {
    if (accessCodes.length === puzzles.length && puzzles.length > 0) {
      setShowMasterOverlay(true);
      setTimeout(() => setShowMasterOverlay(false), 8000);
    }
  }, [accessCodes, puzzles.length]);

  // Show Master Console when master access is unlocked
  useEffect(() => {
    if (accessCodes.includes('MASTER_ACCESS')) {
      setShowMasterConsole(true);
    }
  }, [accessCodes]);

  // Admin: God Mode
  const [godMode, setGodMode] = useState(false);

  // Advanced logging system
  const addLog = (message, type = 'info', timestamp = new Date()) => {
    const log = {
      id: Date.now() + Math.random(),
      message,
      type, // info, success, warning, error, system
      timestamp: timestamp.toLocaleTimeString(),
      details: null
    };
    setSystemLogs(prev => {
      const newLogs = [...prev, log];
      return autoScroll ? newLogs.slice(-100) : newLogs; // Keep last 100 logs
    });
  };

  // Enhanced console command processor with more advanced features
  const executeCommand = (cmd) => {
    const command = cmd.toLowerCase().trim();
    addLog(`> ${cmd}`, 'system');
    setCommandHistory(prev => [...prev, cmd]);
    
    try {
      switch(command) {
        case 'help':
          addLog('Available commands: help, clear, status, unlock-all, reset, matrix, puzzle, theme [dark|light|neon], security [low|standard|high], ai [professional|casual|debug], performance [on|off], backup, export, health, network, macro [name], power [eco|balanced|performance]', 'info');
          break;
        case 'clear':
          setSystemLogs([]);
          break;
        case 'status':
          addLog(`System Status: Access Level ${accessLevel}, Puzzles ${accessCodes.length}/${puzzles.length}, Secrets ${secretsFound}/${totalSecrets}`, 'info');
          addLog(`Health: CPU ${systemHealth.cpu}%, Memory ${systemHealth.memory}MB, Network ${networkStatus.online ? 'Online' : 'Offline'}`, 'info');
          break;
        case 'unlock-all':
          unlockAllSecrets();
          addLog('God Mode activated - All secrets unlocked', 'success');
          addNotification('God Mode activated!', 'success');
          break;
        case 'reset':
          resetAllSecrets();
          addLog('All progress reset', 'warning');
          break;
        case 'matrix':
          setShowMatrix(true);
          addLog('Matrix mode activated', 'success');
          break;
        case 'puzzle':
          triggerPuzzle();
          addLog('Puzzle modal triggered', 'success');
          break;
        case 'theme dark':
          setConsoleTheme('dark');
          addLog('Theme set to dark', 'success');
          break;
        case 'theme light':
          setConsoleTheme('light');
          addLog('Theme set to light', 'success');
          break;
        case 'theme neon':
          setConsoleTheme('neon');
          addLog('Theme set to neon', 'success');
          break;
        case 'security low':
          setSecurityLevel('low');
          addLog('Security level set to LOW', 'warning');
          break;
        case 'security standard':
          setSecurityLevel('standard');
          addLog('Security level set to STANDARD', 'info');
          break;
        case 'security high':
          setSecurityLevel('high');
          addLog('Security level set to HIGH', 'success');
          break;
        case 'ai professional':
          setAiPersonality('professional');
          addLog('AI personality set to Professional', 'info');
          break;
        case 'ai casual':
          setAiPersonality('casual');
          addLog('AI personality set to Casual', 'info');
          break;
        case 'ai debug':
          setAiPersonality('debug');
          addLog('AI personality set to Debug Mode', 'info');
          break;
        case 'performance on':
          setPerformanceMonitor(true);
          addLog('Performance monitoring enabled', 'success');
          break;
        case 'performance off':
          setPerformanceMonitor(false);
          addLog('Performance monitoring disabled', 'info');
          break;
        case 'backup':
          createSystemBackup();
          addLog('System backup created successfully', 'success');
          break;
        case 'export':
          exportSystemData();
          addLog('System data exported', 'success');
          break;
        case 'health':
          addLog(`System Health Report:`, 'info');
          addLog(`CPU Usage: ${systemHealth.cpu}%`, 'info');
          addLog(`Memory: ${systemHealth.memory}MB`, 'info');
          addLog(`Network: ${networkStatus.online ? 'Online' : 'Offline'} (${networkStatus.speed})`, 'info');
          addLog(`Errors: ${systemHealth.errors}, Warnings: ${systemHealth.warnings}`, 'info');
          break;
        case 'network':
          addLog(`Network Status: ${networkStatus.online ? 'Connected' : 'Disconnected'}`, 'info');
          addLog(`Speed: ${networkStatus.speed}, Latency: ${networkStatus.latency}ms`, 'info');
          addLog(`Requests: ${networkStatus.requests}`, 'info');
          break;
        case 'power eco':
          setPowerMode('eco');
          addLog('Power mode set to ECO (reduced animations)', 'success');
          break;
        case 'power balanced':
          setPowerMode('balanced');
          addLog('Power mode set to BALANCED', 'success');
          break;
        case 'power performance':
          setPowerMode('performance');
          addLog('Power mode set to PERFORMANCE (all effects)', 'success');
          break;
        default:
          // Check for macro commands
          const macro = customMacros.find(m => command === `macro ${m.name.toLowerCase()}`);
          if (macro) {
            addLog(`Executing macro: ${macro.name}`, 'info');
            // Execute macro commands
            macro.command.split('&&').forEach(cmd => {
              setTimeout(() => executeCommand(cmd.trim()), 100);
            });
          } else {
            addLog(`Unknown command: ${command}. Type 'help' for available commands.`, 'error');
          }
      }
    } catch (error) {
      addLog(`Command execution failed: ${error.message}`, 'error');
    }
    
    setConsoleInput('');
  };

  // Notification system
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setSystemNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setSystemNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // System backup functionality
  const createSystemBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      accessCodes,
      accessLevel,
      hiddenElementsFound: Array.from(hiddenElementsFound),
      systemSettings: {
        consoleTheme,
        securityLevel,
        aiPersonality,
        performanceMonitor,
        debugMode
      },
      userProgress: {
        puzzleProgress: accessCodes.length,
        secretsFound,
        godMode
      }
    };
    setBackupData(backup);
    localStorage.setItem('systemBackup', JSON.stringify(backup));
    addNotification('System backup created successfully', 'success');
  };

  // Export system data
  const exportSystemData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemStats: {
        ...systemHealth,
        ...advancedMetrics,
        ...networkStatus
      },
      logs: systemLogs,
      userProgress: {
        accessCodes,
        accessLevel,
        secretsFound,
        totalSecrets
      },
      systemConfiguration: {
        consoleTheme,
        securityLevel,
        aiPersonality,
        performanceMonitor,
        powerMode
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDataExport(exportData);
    addNotification('System data exported successfully', 'success');
  };

  // Enhanced performance monitoring with real system metrics
  useEffect(() => {
    if (performanceMonitor) {
      const interval = setInterval(() => {
        // Real system metrics
        const memory = (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;
        const domNodes = document.querySelectorAll('*').length;
        const eventListeners = (window as any).getEventListeners ? Object.keys((window as any).getEventListeners(document)).length : 0;
        
        // Update advanced metrics
        setAdvancedMetrics(prev => ({
          ...prev,
          domNodes,
          eventListeners: typeof eventListeners === 'number' ? eventListeners : 0,
          animationFrames: prev.animationFrames + 1
        }));

        // Update system health
        setSystemHealth(prev => ({
          ...prev,
          cpu: Math.random() * 20 + 10, // Simulated CPU usage
          memory: memory,
          network: navigator.onLine ? 'stable' : 'disconnected'
        }));

        // Update network status
        setNetworkStatus(prev => ({
          ...prev,
          online: navigator.onLine,
          requests: prev.requests + Math.floor(Math.random() * 3),
          latency: Math.random() * 50 + 10
        }));

        addLog(`Performance: Memory ${memory}MB, DOM Nodes: ${domNodes}, Particles: ${particleSystem.length}`, 'system');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [performanceMonitor, particleSystem.length]);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, online: true }));
      addLog('Network connection restored', 'success');
      addNotification('Network connection restored', 'success');
    };
    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, online: false }));
      addLog('Network connection lost', 'error');
      addNotification('Network connection lost', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-backup system
  useEffect(() => {
    if (autoBackup && backupSchedule !== 'manual') {
      const interval = backupSchedule === 'hourly' ? 3600000 : 
                     backupSchedule === 'daily' ? 86400000 : 300000; // 5 min for testing
      
      const backupInterval = setInterval(() => {
        createSystemBackup();
        addLog(`Auto-backup completed (${backupSchedule})`, 'success');
      }, interval);

      return () => clearInterval(backupInterval);
    }
  }, [autoBackup, backupSchedule]);

  // Security monitoring
  useEffect(() => {
    const checkSecurity = () => {
      const alerts = [];
      
      if (securityLevel === 'low' && accessCodes.includes('MASTER_ACCESS')) {
        alerts.push({ type: 'warning', message: 'Master access with low security' });
      }
      
      if (debugMode && securityLevel === 'high') {
        alerts.push({ type: 'error', message: 'Debug mode enabled with high security' });
      }
      
      setSecurityAlerts(alerts);
    };

    checkSecurity();
  }, [securityLevel, accessCodes, debugMode]);

  // Power mode effects on particle system and animations
  useEffect(() => {
    const particleCount = powerMode === 'eco' ? 20 : powerMode === 'balanced' ? 50 : 100;
    const trailLength = powerMode === 'eco' ? 5 : powerMode === 'balanced' ? 15 : 30;
    
    // Adjust particle system based on power mode
    if (particleSystem.length > particleCount) {
      setParticleSystem(prev => prev.slice(0, particleCount));
    }
    
    // Adjust cursor trail based on power mode
    if (cursorTrail.length > trailLength) {
      setCursorTrail(prev => prev.slice(0, trailLength));
    }
  }, [powerMode, particleSystem.length, cursorTrail.length]);

  // Experience mode effects
  useEffect(() => {
    const shouldShowEffects = experienceMode !== 'minimal';
    const shouldShowAdvanced = experienceMode === 'enhanced' || experienceMode === 'immersive';
    
    if (!shouldShowEffects) {
      setShowMatrix(false);
      setParticleSystem([]);
      setCursorTrail([]);
    }
  }, [experienceMode]);

  // Initialize logs
  useEffect(() => {
    addLog('Master Console initialized', 'system');
    addLog('All systems online', 'success');
    addLog(`Experience mode: ${experienceMode.toUpperCase()}`, 'info');
    addLog(`Power mode: ${powerMode.toUpperCase()}`, 'info');
    if (accessCodes.includes('MASTER_ACCESS')) {
      addLog('MASTER_ACCESS detected - Full privileges granted', 'success');
    }
  }, []);

  // Real-time stats updater
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        fps: 60 - Math.random() * 5, // Simulated FPS
        memory: systemHealth.memory,
        cpu: systemHealth.cpu,
        network: networkStatus.online ? 'online' : 'offline',
        uptime: prev.uptime + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [systemHealth.memory, systemHealth.cpu, networkStatus.online]);

  // Console theme styles
  const getThemeStyles = () => {
    switch(consoleTheme) {
      case 'light':
        return {
          bg: 'bg-white/95',
          border: 'border-gray-400',
          text: 'text-gray-900',
          accent: 'text-blue-600'
        };
      case 'neon':
        return {
          bg: 'bg-black/95',
          border: 'border-pink-400',
          text: 'text-pink-300',
          accent: 'text-cyan-400'
        };
      default: // dark
        return {
          bg: 'bg-black/90',
          border: 'border-cyan-400/40',
          text: 'text-cyan-200',
          accent: 'text-cyan-400'
        };
    }
  };

  // Admin: Reveal all answers
  const revealAllAnswers = () => {
    setSecretMessage('All puzzle answers revealed in console!');
    puzzles.forEach(p => console.log(`Puzzle: ${p.question}\nAnswer: ${p.answer}`));
  };

  // Admin: Reset all progress
  const resetAllSecrets = () => {
    setAccessCodes([]);
    setAccessLevel(0);
    setHiddenElementsFound(new Set());
    setShowSecretPanel(false);
    setShowMasterConsole(false);
    setSecretMessage('All progress reset!');
  };

  // Admin: Unlock all secrets instantly
  const unlockAllSecrets = () => {
    setGodMode(true);
    setAccessCodes(puzzles.map(p => p.reward));
    setAccessLevel(4);
    setHiddenElementsFound(new Set(['corner-tl','corner-tr','corner-bl','corner-br']));
    setShowSecretPanel(true);
    setSecretMessage('God Mode: All secrets unlocked!');
  };

  // Admin: Manual toggle for corners
  const toggleCorner = (corner) => {
    setHiddenElementsFound(prev => {
      const newSet = new Set(prev);
      if (newSet.has(corner)) newSet.delete(corner);
      else newSet.add(corner);
      return newSet;
    });
  };

  // Helper: Count discovered corners
  const discoveredCorners = ['corner-tl', 'corner-tr', 'corner-bl', 'corner-br'].filter(corner => hiddenElementsFound.has(corner)).length;

  // Helper: Check triple-click
  const tripleClickUnlocked = accessLevel > 0;
  // Helper: Check quantum
  const quantumUnlocked = showMatrix || accessCodes.length > 0;
  // Helper: Puzzle progress
  const puzzleProgress = accessCodes.length;
  const totalSecrets = 4 + puzzles.length; // 4 secrets + all puzzles
  const secretsFound = discoveredCorners + (tripleClickUnlocked ? 1 : 0) + (quantumUnlocked ? 1 : 0) + puzzleProgress;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen overflow-hidden text-white relative transition-all duration-1000 ${
        glitchActive ? 'animate-pulse' : ''
      }`}
      style={{
        background: `
          radial-gradient(circle at 20% 50%, #1e1b4b 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, #312e81 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, #1e3a8a 0%, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)
        `
      }}
    >
      {/* Demo Mode Warning Banner */}
      {!showInitOverlay && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm border-b border-amber-600">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-amber-900 flex-shrink-0" />
              <p className="text-amber-900 font-medium text-center">
                <strong>Demo Mode Active:</strong> MongoDB is paused due to Atlas free tier inactivity. 
                Use any email/password to login and explore the platform. Full database features are limited.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Initialization Overlay */}
      {showInitOverlay && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center min-h-screen">
          <div className="relative max-w-2xl w-full mx-auto text-center">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
            
            {/* Main Content Container */}
            <div className="relative bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-12 md:p-16">
              {/* Animated CPU Icon */}
              <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping">
                  <Cpu className="w-20 h-20 md:w-24 md:h-24 text-cyan-400/50 mx-auto" />
                </div>
                <Cpu className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 animate-spin mx-auto relative z-10" />
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-8 font-mono tracking-wider">
                EDUCATIONAL MATRIX
              </h1>

              {/* Progress Bar Container */}
              <div className="w-full max-w-md mx-auto mb-8">
                <div className="relative">
                  {/* Background Track */}
                  <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden border border-cyan-400/20">
                    {/* Animated Progress Fill */}
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${initProgress}%` }}
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  {/* Progress Glow */}
                  <div 
                    className="absolute top-0 h-3 bg-gradient-to-r from-cyan-400/50 via-blue-500/50 to-purple-500/50 rounded-full blur-sm transition-all duration-500"
                    style={{ width: `${initProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Text */}
              <div className="space-y-3">
                <p className="text-cyan-300 font-mono text-lg md:text-xl font-semibold tracking-wide">
                  INITIALIZING QUANTUM PROTOCOLS...
                </p>
                <p className="text-cyan-400/80 font-mono text-2xl md:text-3xl font-bold">
                  {initProgress}%
                </p>
                
                {/* Additional Status Messages */}
                <div className="text-xs md:text-sm text-cyan-300/60 font-mono space-y-1 mt-6">
                  <p className={initProgress > 20 ? 'text-green-400' : 'text-cyan-300/60'}>
                    ✓ Neural Networks Loading...
                  </p>
                  <p className={initProgress > 50 ? 'text-green-400' : 'text-cyan-300/60'}>
                    ✓ AI Systems Calibrating...
                  </p>
                  <p className={initProgress > 80 ? 'text-green-400' : 'text-cyan-300/60'}>
                    ✓ Quantum Protocols Activating...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Rain Particles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {particleSystem.map(particle => (
          <div
            key={particle.id}
            className="absolute text-xs font-mono transition-opacity duration-1000"
            style={{
              left: particle.x,
              top: particle.y,
              color: particle.color,
              opacity: particle.opacity,
              fontSize: '12px'
            }}
          >
            {particle.char}
          </div>
        ))}
      </div>

      {/* Holographic Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <svg width="100%" height="100%" className="opacity-10">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke={colors.primary} strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Dark Overlay for Better Contrast */}
      <div 
        className="fixed inset-0 pointer-events-none z-6"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.3) 70%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.4) 100%)
          `
        }}
      />

      {/* Interactive Cursor Trail */}
      <div className="fixed inset-0 pointer-events-none z-15">
        {cursorTrail.map((point, index) => (
          <div
            key={point.id}
            className="absolute w-2 h-2 rounded-full bg-cyan-400"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              opacity: Math.max(0, 1 - (Date.now() - point.timestamp) / 1000),
              transform: `scale(${Math.max(0.1, 1 - index * 0.1)})`,
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
              animation: `pulse 0.5s ease-out`
            }}
          />
        ))}
      </div>

      {/* Matrix Mode Overlay */}
      {showMatrix && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-green-400 font-mono text-sm mb-4 animate-pulse">
              {Array.from({length: 50}).map((_, i) => (
                <div key={i} className="inline-block mx-1">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </div>
              ))}
            </div>
            <h2 className="text-4xl font-bold text-green-400 font-mono mb-4">
              MATRIX BREACH DETECTED
            </h2>
            <p className="text-green-300 font-mono">
              NEURAL PATHWAYS COMPROMISED... REALITY BUFFER OVERFLOW...
            </p>
          </div>
        </div>
      )}

      {/* Master Access Overlay */}
      {showMasterOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-black/90 via-purple-900/80 to-cyan-900/90 animate-fade-in">
          <div className="text-center p-12 rounded-3xl shadow-2xl border-4 border-purple-400/60 bg-black/80 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <span className="text-6xl animate-bounce">🚀</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-glow">
              MASTER ACCESS UNLOCKED
            </h1>
            <p className="text-lg md:text-2xl text-cyan-200 font-mono mb-6 animate-fade-in">
              You have solved all secret challenges and puzzles.<br />
              Welcome to the core of the Educational Matrix!
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <span className="text-3xl animate-spin">🛡️</span>
              <span className="text-3xl animate-pulse">🧠</span>
              <span className="text-3xl animate-bounce">🔓</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Geometric Shapes */}
      <div className="fixed inset-0 pointer-events-none z-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute border opacity-20"
            style={{
              width: `${50 + i * 20}px`,
              height: `${50 + i * 20}px`,
              borderColor: i % 2 === 0 ? colors.primary : colors.secondary,
              left: `${10 + i * 12}%`,
              top: `${20 + i * 8}%`,
              transform: `rotate(${i * 45}deg) translate(${mousePosition.x * (i + 1) * 0.1}px, ${mousePosition.y * (i + 1) * 0.1}px)`,
              borderRadius: i % 3 === 0 ? '50%' : '0',
              animation: `float-${i} ${8 + i * 2}s ease-in-out infinite`,
              transition: 'transform 0.3s ease-out'
            }}
          />
        ))}
      </div>

      {/* Scanning Line Effect */}
      <div 
        className="fixed left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-20 pointer-events-none"
        style={{
          top: `${scanProgress}%`,
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
          animation: 'scan 3s linear infinite'
        }}
      />

      {/* Main Content */}
      <div className={`relative z-20 transition-opacity duration-1000 ${systemOnline ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Floating Performance Indicator */}
        {performanceMonitor && (
          <div className="fixed top-4 right-4 z-30 bg-black/80 border border-green-400/50 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-xs font-mono text-green-400">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${realTimeStats.network === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>SYSTEM</span>
              </div>
              <div>CPU: {realTimeStats.cpu.toFixed(0)}%</div>
              <div>MEM: {realTimeStats.memory}MB</div>
              <div>FPS: {realTimeStats.fps.toFixed(0)}</div>
              <div>NET: {realTimeStats.network}</div>
            </div>
          </div>
        )}

        {/* Scanning Line Effect */}
        <div 
          className="fixed left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-20 pointer-events-none"
          style={{
            top: `${scanProgress}%`,
            transition: 'top 0.05s linear',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)'
          }}
        />
        
        {/* Navigation Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-30">
          <div 
            className="flex justify-between items-center backdrop-blur-sm bg-black/20 rounded-lg p-4 border border-cyan-400/30"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* System Status */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <span 
                className="text-sm font-mono text-green-400"
                style={{
                  textShadow: '0 0 10px rgba(74, 222, 128, 0.8)'
                }}
              >
                SYSTEM ONLINE
              </span>
            </div>

            {/* Logo/Brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Cpu className="text-cyan-400 animate-spin hover:scale-110 transition-transform duration-300" size={32} />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping" />
                <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-pulse" />
              </div>
              <h1 
                className="text-xl font-bold font-mono hidden md:block text-white"
                style={{
                  textShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 2px 10px rgba(0, 0, 0, 0.8)'
                }}
              >
                EDUCATIONAL MATRIX
              </h1>
            </div>

            {/* AI Status */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <Terminal className="text-purple-400" size={16} />
              <span 
                className="text-purple-400"
                style={{
                  textShadow: '0 0 10px rgba(168, 85, 247, 0.8)'
                }}
              >
                AI ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 relative">
          
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Main Title */}
            <div className="mb-12 mt-8">
              <h1 className="text-6xl md:text-8xl font-bold mb-4 font-mono">
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse"
                  style={{
                    textShadow: '0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(59, 130, 246, 0.6), 0 0 90px rgba(139, 92, 246, 0.4)',
                    filter: 'drop-shadow(0 4px 20px rgba(6, 182, 212, 0.5))'
                  }}
                >
                  E-F-G
                </span>
              </h1>
              <h2 
                className="text-2xl md:text-4xl font-light text-white mb-6"
                style={{
                  textShadow: '0 2px 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
                  filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.8))'
                }}
              >
                Educational Feedback Galaxy
              </h2>
            </div>

            {/* AI Typing Display */}
            <div className="mb-12 h-8">
              <p 
                className="text-lg font-mono text-cyan-300"
                style={{
                  textShadow: '0 0 20px rgba(103, 232, 249, 0.8), 0 2px 10px rgba(0, 0, 0, 0.8)',
                  filter: 'drop-shadow(0 0 10px rgba(103, 232, 249, 0.6))'
                }}
              >
                {displayText}
                <span className="animate-pulse ml-1">|</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              
              {/* Login Button */}
              <Link to="/login" state={{ tab: 'login' }}>
                <div 
                  className={`group relative overflow-hidden border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-500 ${
                    loginHovered ? 'scale-105' : ''
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)',
                    padding: '16px 32px'
                  }}
                  onMouseEnter={() => setLoginHovered(true)}
                  onMouseLeave={() => setLoginHovered(false)}
                >
                  <div className="flex items-center gap-3">
                    <User className="text-cyan-400" size={20} />
                    <span className="text-cyan-400 font-bold font-mono">ACCESS PORTAL</span>
                    <ArrowRight className={`text-cyan-400 transition-transform duration-300 ${
                      loginHovered ? 'translate-x-2' : ''
                    }`} size={20} />
                  </div>
                  
                  {/* Animated border effect */}
                  <div className="absolute inset-0 border-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                </div>
              </Link>

              {/* Register Button */}
              <Link to="/login" state={{ tab: 'register' }}>
                <div 
                  className={`group relative overflow-hidden border-2 border-purple-400 bg-purple-400/10 hover:bg-purple-400/20 transition-all duration-500 ${
                    signupHovered ? 'scale-105' : ''
                  }`}
                  style={{
                    clipPath: 'polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)',
                    padding: '16px 32px'
                  }}
                  onMouseEnter={() => setSignupHovered(true)}
                  onMouseLeave={() => setSignupHovered(false)}
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="text-purple-400" size={20} />
                    <span className="text-purple-400 font-bold font-mono">INITIALIZE</span>
                    <Sparkles className={`text-purple-400 transition-transform duration-300 ${
                      signupHovered ? 'rotate-12' : ''
                    }`} size={20} />
                  </div>
                  
                  {/* Animated border effect */}
                  <div className="absolute inset-0 border-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      clipPath: 'polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                </div>
              </Link>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="relative p-4 border border-gray-500 bg-black/40 backdrop-blur-sm"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% calc(100% - 10px), 10px 100%)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 20px ${stat.color}20`
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ 
                      color: stat.color,
                      filter: `drop-shadow(0 0 10px ${stat.color})` 
                    }}>
                      {stat.icon}
                    </div>
                    <div 
                      className="text-2xl font-bold font-mono" 
                      style={{ 
                        color: stat.color,
                        textShadow: `0 0 20px ${stat.color}, 0 2px 10px rgba(0, 0, 0, 0.8)`
                      }}
                    >
                      {stat.number}
                    </div>
                    <div 
                      className="text-xs text-gray-300 font-mono"
                      style={{
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      {stat.text}
                    </div>
                  </div>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 border opacity-50 animate-pulse"
                    style={{
                      borderColor: stat.color,
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% calc(100% - 10px), 10px 100%)',
                      boxShadow: `0 0 20px ${stat.color}40`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="text-cyan-400" size={32} />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 
                className="text-4xl md:text-6xl font-bold font-mono mb-4"
                style={{
                  textShadow: '0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(139, 92, 246, 0.6)'
                }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                  CORE SYSTEMS
                </span>
              </h2>
              <p 
                className="text-xl text-gray-300 max-w-3xl mx-auto"
                style={{
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                }}
              >
                Advanced educational technologies powered by quantum computing and neural networks
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group relative p-6 border border-gray-500 bg-black/40 backdrop-blur-sm hover:border-cyan-400 transition-all duration-500 hover:scale-105"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% calc(100% - 15px), 15px 100%)',
                    animationDelay: `${feature.delay}s`,
                    background: 'rgba(0, 0, 0, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div 
                      className="p-4 rounded border-2 group-hover:animate-pulse"
                      style={{ 
                        borderColor: feature.color,
                        color: feature.color,
                        boxShadow: `0 0 20px ${feature.color}40`,
                        filter: `drop-shadow(0 0 10px ${feature.color})`
                      }}
                    >
                      {feature.icon}
                    </div>
                    
                    <h3 
                      className="text-xl font-bold font-mono text-white"
                      style={{
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      {feature.title}
                    </h3>
                    
                    <p 
                      className="text-gray-300 text-sm leading-relaxed"
                      style={{
                        textShadow: '0 1px 8px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Hover effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}40, transparent)`,
                      clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% calc(100% - 15px), 15px 100%)'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-24 px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold font-mono mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                READY TO CONNECT?
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join the educational revolution. Access your personalized learning matrix and unlock unlimited potential.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/login" state={{ tab: 'login' }}>
                <div className="group relative overflow-hidden border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-500 hover:scale-105"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)',
                    padding: '20px 40px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Power className="text-cyan-400" size={24} />
                    <span className="text-cyan-400 font-bold font-mono text-lg">ENTER MATRIX</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes float-0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px) rotate(45deg); } 50% { transform: translateY(-25px) rotate(225deg); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px) rotate(90deg); } 50% { transform: translateY(-15px) rotate(270deg); } }
        @keyframes float-3 { 0%, 100% { transform: translateY(0px) rotate(135deg); } 50% { transform: translateY(-30px) rotate(315deg); } }
        @keyframes float-4 { 0%, 100% { transform: translateY(0px) rotate(180deg); } 50% { transform: translateY(-18px) rotate(360deg); } }
        @keyframes float-5 { 0%, 100% { transform: translateY(0px) rotate(225deg); } 50% { transform: translateY(-22px) rotate(405deg); } }
        @keyframes float-6 { 0%, 100% { transform: translateY(0px) rotate(270deg); } 50% { transform: translateY(-28px) rotate(450deg); } }
        @keyframes float-7 { 0%, 100% { transform: translateY(0px) rotate(315deg); } 50% { transform: translateY(-16px) rotate(495deg); } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes glow { 0%, 100% { text-shadow: 0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.6); } 50% { text-shadow: 0 0 20px rgba(6, 182, 212, 1), 0 0 40px rgba(6, 182, 212, 0.8); } }
      `}</style>
    </div>
  );
};

export default Index;

