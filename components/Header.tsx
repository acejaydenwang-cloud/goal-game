import React, { useMemo } from 'react';
import { PlayerStats } from '../types';
import { LEVEL_THRESHOLDS } from '../constants';
import { Shield, Zap, Skull, Crown } from 'lucide-react';

interface HeaderProps {
  stats: PlayerStats;
  currentDmg: number;
  onRelapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, currentDmg, onRelapse }) => {
  const currentTitle = useMemo(() => {
    return [...LEVEL_THRESHOLDS].reverse().find(t => stats.streak >= t.days)?.title || 'Wandering Soul';
  }, [stats.streak]);

  const buffStatus = useMemo(() => {
    if (stats.streak < 3) return { text: 'WEAKENED', color: 'text-gray-500', icon: <Skull size={14} /> };
    if (stats.streak < 7) return { text: 'RECOVERING', color: 'text-blue-400', icon: <Shield size={14} /> };
    if (stats.streak < 30) return { text: 'LUCID', color: 'text-green-400', icon: <Zap size={14} /> };
    return { text: 'HOLY BODY', color: 'text-gold', icon: <Crown size={14} /> };
  }, [stats.streak]);

  const hpPercentage = Math.min((stats.hp / stats.maxHp) * 100, 100);

  return (
    <header className="w-full glass-panel p-4 mb-6 sticky top-0 z-20 rounded-b-xl border-b border-gold/20 shadow-lg shadow-black/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-widest flex items-center gap-2">
            LV.{stats.level} <span className="text-gold neon-text-gold">{currentTitle}</span>
          </h1>
          <div className={`text-xs font-mono font-bold flex items-center gap-1 mt-1 ${buffStatus.color}`}>
            {buffStatus.icon} {buffStatus.text} • DAY {stats.streak}
          </div>
        </div>
        <button 
          onClick={() => {
            if(window.confirm('Are you sure you want to relapse? All progress will be lost.')) {
              onRelapse();
            }
          }}
          className="bg-red-900/30 hover:bg-red-900/50 text-red-500 text-xs px-3 py-1 rounded border border-red-900/50 transition-colors"
        >
          RELAPSE
        </button>
      </div>

      {/* HP Bar */}
      <div className="relative w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${hpPercentage}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
          HP: {stats.hp} / {stats.maxHp}
        </div>
      </div>

      {/* Attack Power Preview */}
      <div className="flex justify-end mt-1">
        <span className="text-xs text-magic font-mono">Current AP: {currentDmg}</span>
      </div>
    </header>
  );
};