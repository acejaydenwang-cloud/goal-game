import React, { useState, useEffect } from 'react';
import { Wind, X } from 'lucide-react';

interface ShrineProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Shrine: React.FC<ShrineProps> = ({ isOpen, onClose }) => {
  const [stage, setStage] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('Breathe In');

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev === 'inhale') {
           setText('Hold...');
           return 'hold';
        }
        if (prev === 'hold') {
            setText('Breathe Out...');
            return 'exhale';
        }
        setText('Breathe In...');
        return 'inhale';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-500">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-display text-blue-300 mb-12 tracking-widest uppercase">Sanctuary of Mind</h2>
        
        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center w-64 h-64">
           {/* Outer Glow Ring */}
           <div className={`
              absolute w-full h-full rounded-full border-2 border-blue-500/30
              transition-all duration-[4000ms] ease-in-out
              ${stage === 'inhale' ? 'scale-110 opacity-50' : stage === 'hold' ? 'scale-110 opacity-50' : 'scale-75 opacity-20'}
           `}></div>

           {/* Core Circle */}
           <div className={`
              w-32 h-32 bg-blue-500/20 rounded-full blur-xl absolute
              transition-all duration-[4000ms] ease-in-out
              ${stage === 'inhale' ? 'scale-150 bg-blue-400/30' : stage === 'hold' ? 'scale-150 bg-blue-400/30' : 'scale-50 bg-blue-900/10'}
           `}></div>
           
           <div className="z-10 text-blue-100 font-display text-xl font-bold tracking-widest transition-all duration-500">
              {text}
           </div>
        </div>

        <p className="mt-12 text-gray-500 max-w-xs text-center text-sm leading-relaxed">
           Resist the urge. Transmute the energy. <br/>
           You are in control.
        </p>
      </div>
    </div>
  );
};