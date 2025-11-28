import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { QuestBoard } from './components/QuestBoard';
import { BossArena } from './components/BossArena';
import { Shrine } from './components/Shrine';
import { Task, PlayerStats, GameState } from './types';
import { WEEKDAY_BOSSES, INITIAL_TASKS, DIFFICULTY_DMG, LEVEL_THRESHOLDS } from './constants';
import { Wind } from 'lucide-react';

const STORAGE_KEY = 'flow_warrior_save_v1';

const getDayString = () => new Date().toISOString().split('T')[0];

const INITIAL_STATE: GameState = {
  stats: {
    streak: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    lastRelapse: Date.now(),
  },
  tasks: INITIAL_TASKS,
  lastLoginDate: getDayString(),
  inventory: []
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [isShrineOpen, setIsShrineOpen] = useState(false);
  const [isGreyScale, setIsGreyScale] = useState(false);

  // Daily Reset Logic
  useEffect(() => {
    const today = getDayString();
    if (gameState.lastLoginDate !== today) {
      setGameState(prev => ({
        ...prev,
        lastLoginDate: today,
        // Reset daily tasks
        tasks: prev.tasks.map(t => ({ ...t, completed: false }))
      }));
    }
  }, [gameState.lastLoginDate]);

  // Persist State
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Derived Stats
  const currentBoss = useMemo(() => {
    const dayIndex = new Date().getDay();
    return WEEKDAY_BOSSES[dayIndex];
  }, []);

  const totalAttackPower = useMemo(() => {
    return gameState.tasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + DIFFICULTY_DMG[t.difficulty], 0);
  }, [gameState.tasks]);

  // Actions
  const handleRelapse = () => {
    setIsGreyScale(true);
    setGameState({
      ...INITIAL_STATE,
      lastLoginDate: getDayString(),
      stats: {
        ...INITIAL_STATE.stats,
        lastRelapse: Date.now()
      }
    });
    
    // Remove greyscale after animation
    setTimeout(() => setIsGreyScale(false), 3000);
  };

  const updateStreak = () => {
    const now = Date.now();
    const lastRelapse = gameState.stats.lastRelapse;
    const diffTime = Math.abs(now - lastRelapse);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Level calc
    const levelInfo = [...LEVEL_THRESHOLDS].reverse().find(t => diffDays >= t.days) || LEVEL_THRESHOLDS[0];
    const newMaxHp = 100 + (diffDays * 10);

    setGameState(prev => {
      // Don't auto-heal above current max if we are just updating streak info
      // but do increase maxHP
      const currentHpRatio = prev.stats.hp / prev.stats.maxHp;
      
      return {
        ...prev,
        stats: {
          ...prev.stats,
          streak: diffDays,
          level: levelInfo.level,
          maxHp: newMaxHp,
          // Optional: Heal lightly on level up, but here we keep it sticky for the game mechanic
          hp: Math.min(prev.stats.hp, newMaxHp) || newMaxHp 
        }
      };
    });
  };

  // Check streak on mount
  useEffect(() => {
    updateStreak();
    const interval = setInterval(updateStreak, 60000); // Check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTask = (id: string) => {
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const handleAddTask = (task: Task) => {
    setGameState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));
  };

  const handleDeleteTask = (id: string) => {
      setGameState(prev => ({
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== id)
      }));
  };

  const handleBattleEnd = (result: { outcome: 'win' | 'loss', damageTaken: number }) => {
    setGameState(prev => {
        // Calculate new HP based on damage taken
        let newHp = Math.max(0, prev.stats.hp - result.damageTaken);
        
        // If loss, we ensure HP is low but not 0 to allow retry after recovery, or strict mode:
        if (result.outcome === 'loss' && newHp <= 0) {
           newHp = 1; // Mercy: leave 1 HP
        }

        return {
            ...prev,
            stats: {
                ...prev.stats,
                hp: newHp
            }
        };
    });
  };

  return (
    <div className={`min-h-screen pb-12 transition-all duration-1000 ${isGreyScale ? 'grayscale brightness-50' : ''}`}>
      <div className="max-w-md mx-auto relative px-4 pt-4">
        
        <Header 
          stats={gameState.stats} 
          currentDmg={totalAttackPower}
          onRelapse={handleRelapse}
        />

        <BossArena 
          boss={currentBoss} 
          playerStats={gameState.stats}
          playerDmg={totalAttackPower}
          onFightEnd={handleBattleEnd}
        />

        <QuestBoard 
          tasks={gameState.tasks}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />

        {/* Floating Shrine Button */}
        <button 
          onClick={() => setIsShrineOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-400/30 rounded-full p-4 shadow-lg shadow-blue-900/50 backdrop-blur-sm transition-all hover:scale-110 z-30"
          title="Enter Shrine"
        >
          <Wind size={24} />
        </button>

        <Shrine 
          isOpen={isShrineOpen} 
          onClose={() => setIsShrineOpen(false)} 
        />
        
      </div>
    </div>
  );
};

export default App;