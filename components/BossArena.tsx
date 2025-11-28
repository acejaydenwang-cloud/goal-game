import React, { useState, useEffect, useRef } from 'react';
import { Boss, PlayerStats } from '../types';
import { Skull, Trophy, Keyboard, Sword, Shield } from 'lucide-react';

interface BossArenaProps {
  boss: Boss;
  playerStats: PlayerStats;
  playerDmg: number;
  onFightEnd: (result: { outcome: 'win' | 'loss', damageTaken: number }) => void;
}

// --- Game Constants ---
const ARENA_WIDTH = 600;
const ARENA_HEIGHT = 350;
const GROUND_Y = 250;

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 90;
const BOSS_WIDTH = 80;
const BOSS_HEIGHT = 110;

// Base damage allows playing even without tasks
const BASE_PLAYER_DMG = 10;

// Hitbox Definitions
const ATTACK_RANGES = {
  PUNCH: { width: 70, damageMult: 0.5, frameDuration: 20, startup: 5, recovery: 10 },
  KICK: { width: 100, damageMult: 1.2, frameDuration: 35, startup: 12, recovery: 20 },
  BOSS_ATTACK: { width: 100, damageMult: 1.0, frameDuration: 50, startup: 25, recovery: 20 },
};

type ActionState = 'IDLE' | 'MOVE' | 'BLOCK' | 'PUNCH' | 'KICK' | 'HIT' | 'STUN' | 'ATTACK_PREP';

interface Entity {
  x: number;
  y: number;
  vx: number;
  facing: 1 | -1; // 1 = right, -1 = left
  hp: number;
  maxHp: number;
  state: ActionState;
  frameTimer: number; // For animation locking
  iframes: number;
}

export const BossArena: React.FC<BossArenaProps> = ({ boss, playerStats, playerDmg, onFightEnd }) => {
  // --- Game State (Refs for performance) ---
  const playerRef = useRef<Entity>({
    x: 100, y: GROUND_Y, vx: 0, facing: 1,
    hp: playerStats.hp, maxHp: playerStats.maxHp,
    state: 'IDLE', frameTimer: 0, iframes: 0
  });

  const bossRef = useRef<Entity>({
    x: 450, y: GROUND_Y - (BOSS_HEIGHT - PLAYER_HEIGHT), vx: 0, facing: -1,
    hp: boss.hp, maxHp: boss.hp,
    state: 'IDLE', frameTimer: 0, iframes: 0
  });

  const keys = useRef<Record<string, boolean>>({});
  const requestRef = useRef<number>(undefined);
  const gameActive = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- UI State ---
  const [uiState, setUiState] = useState<{
    gameStatus: 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT';
    playerHp: number;
    bossHp: number;
    feedback: string | null;
    shake: boolean;
    hitFlash: boolean;
    activeKeys: string[];
  }>({
    gameStatus: 'MENU',
    playerHp: playerStats.hp,
    bossHp: boss.hp,
    feedback: null,
    shake: false,
    hitFlash: false,
    activeKeys: []
  });

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (!gameActive.current && uiState.gameStatus !== 'PLAYING') return;
      keys.current[e.key.toLowerCase()] = true; 
      keys.current[e.key] = true; 
      
      // Update UI for key press visualization
      setUiState(prev => {
        const k = e.key.toLowerCase();
        if(!prev.activeKeys.includes(k)) return {...prev, activeKeys: [...prev.activeKeys, k]};
        return prev;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => { 
      keys.current[e.key.toLowerCase()] = false; 
      keys.current[e.key] = false;

       // Update UI for key press visualization
       setUiState(prev => ({...prev, activeKeys: prev.activeKeys.filter(k => k !== e.key.toLowerCase())}));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [uiState.gameStatus]);

  // --- Game Loop Logic ---
  const updatePhysics = () => {
    if (!gameActive.current) return;

    const p = playerRef.current;
    const b = bossRef.current;
    
    // Total Damage calculation
    const effectivePlayerDmg = Math.max(BASE_PLAYER_DMG, playerDmg);

    // 1. Player Input Processing
    if (p.state === 'IDLE' || p.state === 'MOVE') {
      p.vx = 0;
      p.state = 'IDLE';

      if (keys.current['arrowdown']) {
        p.state = 'BLOCK';
      } else if (keys.current['d']) {
        p.state = 'PUNCH';
        p.frameTimer = ATTACK_RANGES.PUNCH.frameDuration;
      } else if (keys.current['b']) {
        p.state = 'KICK';
        p.frameTimer = ATTACK_RANGES.KICK.frameDuration;
      } else {
        if (keys.current['arrowleft']) { p.vx = -6; p.facing = -1; p.state = 'MOVE'; }
        if (keys.current['arrowright']) { p.vx = 6; p.facing = 1; p.state = 'MOVE'; }
      }
    } else if (p.state === 'BLOCK') {
      p.vx = 0;
      if (!keys.current['arrowdown']) p.state = 'IDLE';
    } else {
      // Locked in animation (Attack/Hit)
      p.vx = 0;
      p.frameTimer--;
      if (p.frameTimer <= 0) p.state = 'IDLE';
    }

    // 2. Boss AI
    if (b.state === 'IDLE' || b.state === 'MOVE') {
      const dist = Math.abs(p.x - b.x);
      const attackRange = 100;
      
      // Face player
      b.facing = p.x > b.x ? 1 : -1;

      if (dist < attackRange) {
        // Attack chance
        if (Math.random() < 0.04) {
          b.state = 'ATTACK_PREP';
          b.frameTimer = 30; // Telegrah time
        } else {
          b.state = 'IDLE';
          b.vx = 0;
        }
      } else {
        // Chase
        b.state = 'MOVE';
        b.vx = b.facing * 3; 
      }
    } else if (b.state === 'ATTACK_PREP') {
      b.vx = 0;
      b.frameTimer--;
      if (b.frameTimer <= 0) {
        b.state = 'PUNCH'; // Uses generic attack state name
        b.frameTimer = ATTACK_RANGES.BOSS_ATTACK.frameDuration;
      }
    } else {
      // Locked
      b.vx = 0;
      b.frameTimer--;
      if (b.frameTimer <= 0) b.state = 'IDLE';
    }

    // 3. Movement Application
    p.x = Math.max(0, Math.min(ARENA_WIDTH - PLAYER_WIDTH, p.x + p.vx));
    b.x = Math.max(0, Math.min(ARENA_WIDTH - BOSS_WIDTH, b.x + b.vx));

    // 4. Combat / Collision Detection
    
    // Player hits Boss
    if ((p.state === 'PUNCH' || p.state === 'KICK') && b.iframes <= 0) {
      const attackData = p.state === 'PUNCH' ? ATTACK_RANGES.PUNCH : ATTACK_RANGES.KICK;
      const frameProgress = attackData.frameDuration - p.frameTimer;
      
      // Hit window
      if (frameProgress > attackData.startup && frameProgress < (attackData.frameDuration - attackData.recovery)) {
        const hitboxX = p.facing === 1 ? p.x + PLAYER_WIDTH : p.x - attackData.width;
        const hit = (p.facing === 1 && hitboxX >= b.x && p.x < b.x + BOSS_WIDTH) ||
                    (p.facing === -1 && hitboxX <= b.x + BOSS_WIDTH && p.x > b.x);
        
        if (hit) {
          const rawDmg = Math.max(1, Math.floor(effectivePlayerDmg * attackData.damageMult));
          const isCrit = Math.random() < 0.2;
          const finalDmg = isCrit ? rawDmg * 2 : rawDmg;

          b.hp -= finalDmg;
          b.iframes = 20;
          b.state = 'HIT';
          b.frameTimer = 15;
          b.x += p.facing * 30; // Knockback
          
          triggerFeedback(`${isCrit ? 'CRITICAL!' : 'HIT'} ${finalDmg}`, true);
        }
      }
    }

    // Boss hits Player
    if (b.state === 'PUNCH' && p.iframes <= 0) {
      const attackData = ATTACK_RANGES.BOSS_ATTACK;
      const frameProgress = attackData.frameDuration - b.frameTimer;
      
      if (frameProgress > attackData.startup && frameProgress < (attackData.frameDuration - attackData.recovery)) {
        const hitboxX = b.facing === 1 ? b.x + BOSS_WIDTH : b.x - attackData.width;
        const hit = (b.facing === 1 && hitboxX >= p.x && b.x < p.x + PLAYER_WIDTH) ||
                    (b.facing === -1 && hitboxX <= p.x + PLAYER_WIDTH && b.x > p.x);

        if (hit) {
          let dmg = boss.attack;
          let blocked = false;
          
          if (p.state === 'BLOCK') {
            dmg = Math.ceil(dmg * 0.2); // 80% reduction
            blocked = true;
          }

          p.hp -= dmg;
          p.iframes = 40;
          p.state = 'HIT';
          p.frameTimer = 20;
          p.x += b.facing * 50; 
          
          triggerFeedback(blocked ? 'BLOCKED!' : `-${dmg} HP`, !blocked);
        }
      }
    }

    // Cooldowns
    if (p.iframes > 0) p.iframes--;
    if (b.iframes > 0) b.iframes--;

    // 5. Sync HP to UI (throttled slightly by react render cycle usually, but here we force sync for smoothness)
    // We only update React state if values changed significantly or to show feedback, to avoid lag
    // Actually, setting state every frame is bad. We'll update the HP bars directly via DOM or throttle state updates.
    // For this size app, React state update every frame might be jittery. Let's rely on `loop` to update sprite transforms and checks.
    
    // Win/Loss Check
    if (b.hp <= 0) endGame('VICTORY');
    else if (p.hp <= 0) endGame('DEFEAT');
  };

  const triggerFeedback = (text: string, shake: boolean) => {
    setUiState(prev => ({ 
      ...prev, 
      bossHp: bossRef.current.hp, 
      playerHp: playerRef.current.hp,
      feedback: text,
      shake: shake,
      hitFlash: shake // Flash on big hits
    }));
    // Clear shake/flash shortly after
    setTimeout(() => setUiState(prev => ({ ...prev, shake: false, hitFlash: false })), 300);
    setTimeout(() => setUiState(prev => ({ ...prev, feedback: null })), 1000);
  };

  const loop = () => {
    updatePhysics();
    if (gameActive.current) {
      requestRef.current = requestAnimationFrame(loop);
    }
    updateSprites();
  };

  const updateSprites = () => {
    const pEl = document.getElementById('player-root');
    const bEl = document.getElementById('boss-root');
    const p = playerRef.current;
    const b = bossRef.current;

    if (pEl) {
      pEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
      // Apply visual filters logic
      pEl.style.filter = p.iframes > 0 && p.iframes % 8 < 4 ? 'brightness(2) opacity(0.5)' : 'none';
      
      // Update internal class for animation state (handled by React render mostly, but can force classes via JS if needed for perf)
      // Since we want high FPS, we rely on the React render for the *internal* look of the sprite (punch vs kick) which changes less often than X/Y
    }
    if (bEl) {
      bEl.style.transform = `translate(${b.x}px, ${b.y}px)`;
      bEl.style.filter = b.state === 'ATTACK_PREP' 
        ? `drop-shadow(0 0 10px red) brightness(${1 + (Math.random())})` 
        : b.iframes > 0 ? 'invert(1)' : 'none';
    }
  };

  // Force re-render of visuals when state changes (animation switching)
  // We use a separate effect to sync the visual "Pose" without re-rendering the whole arena loop logic
  const [visualState, setVisualState] = useState({ pState: 'IDLE', bState: 'IDLE', pFacing: 1, bFacing: -1 });
  
  useEffect(() => {
    if(!gameActive.current) return;
    let animationFrameId: number;
    
    const renderLoop = () => {
      const p = playerRef.current;
      const b = bossRef.current;
      
      setVisualState(prev => {
        if (prev.pState !== p.state || prev.bState !== b.state || prev.pFacing !== p.facing || prev.bFacing !== b.facing) {
          return { pState: p.state, bState: b.state, pFacing: p.facing, bFacing: b.facing };
        }
        return prev;
      });
      animationFrameId = requestAnimationFrame(renderLoop);
    }
    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [uiState.gameStatus]);


  const startGame = () => {
    playerRef.current = {
      x: 100, y: GROUND_Y, vx: 0, facing: 1,
      hp: playerStats.hp, maxHp: playerStats.maxHp,
      state: 'IDLE', frameTimer: 0, iframes: 0
    };
    bossRef.current = {
      x: 450, y: GROUND_Y - (BOSS_HEIGHT - PLAYER_HEIGHT), vx: 0, facing: -1,
      hp: boss.hp, maxHp: boss.hp,
      state: 'IDLE', frameTimer: 0, iframes: 0
    };
    
    gameActive.current = true;
    setUiState({ 
      gameStatus: 'PLAYING', 
      playerHp: playerStats.hp, 
      bossHp: boss.hp, 
      feedback: 'FIGHT!', 
      shake: false, 
      hitFlash: false,
      activeKeys: [] 
    });
    
    requestRef.current = requestAnimationFrame(loop);
    
    // Focus container to capture keys if we were using tabIndex, but window listener handles it.
    if(containerRef.current) containerRef.current.focus();
  };

  const endGame = (status: 'VICTORY' | 'DEFEAT') => {
    gameActive.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setUiState(prev => ({ ...prev, gameStatus: status }));
    onFightEnd({ 
      outcome: status === 'VICTORY' ? 'win' : 'loss',
      damageTaken: playerStats.hp - playerRef.current.hp
    });
  };

  // --- Visual Components (Neon Stickmen) ---

  const PlayerSprite = ({ state, facing }: { state: ActionState, facing: number }) => {
    // Dynamic styles based on state
    const isPunch = state === 'PUNCH';
    const isKick = state === 'KICK';
    const isBlock = state === 'BLOCK';
    const isMove = state === 'MOVE';

    return (
      <div className={`relative w-[50px] h-[90px] transition-transform duration-75 ${facing === -1 ? 'scale-x-[-1]' : ''}`}>
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>

        {/* Head */}
        <div className={`absolute top-0 left-[10px] w-8 h-8 rounded-full border-2 border-cyan-400 bg-black z-20 ${isMove ? 'translate-x-2' : ''}`}>
           <div className="absolute top-2 right-1 w-4 h-1 bg-cyan-400 shadow-[0_0_5px_cyan]"></div> {/* Visor */}
        </div>

        {/* Torso */}
        <div className={`absolute top-8 left-[20px] w-1 h-10 bg-cyan-400 shadow-[0_0_8px_cyan] ${isKick ? 'rotate-[-15deg]' : ''}`}></div>

        {/* Arms */}
        {/* Back Arm */}
        <div className={`absolute top-9 left-[20px] w-8 h-1 bg-cyan-600 origin-left transition-all duration-75 
          ${isBlock ? 'rotate-[-45deg]' : isPunch ? 'rotate-[20deg]' : 'rotate-[45deg]'}`}></div>
        
        {/* Front Arm (Punch) */}
        <div className={`absolute top-10 left-[20px] w-8 h-1 bg-cyan-300 origin-left shadow-[0_0_5px_cyan] transition-all duration-50 z-20
          ${isBlock ? 'rotate-[-80deg] translate-x-2' : isPunch ? 'w-16 bg-white shadow-[0_0_15px_white]' : 'rotate-[60deg]'}`}>
            {isPunch && <div className="absolute right-0 top-[-10px] w-8 h-6 bg-cyan-200 blur-md rounded-full"></div>} {/* Punch Flare */}
        </div>

        {/* Legs */}
        {/* Back Leg */}
        <div className={`absolute top-[70px] left-[20px] w-1 h-8 bg-cyan-600 origin-top transition-all duration-100
          ${isMove ? 'rotate-[-30deg]' : isKick ? 'rotate-[45deg]' : 'rotate-[20deg]'}`}></div>

        {/* Front Leg (Kick) */}
        <div className={`absolute top-[70px] left-[20px] w-1 h-8 bg-cyan-300 origin-top shadow-[0_0_5px_cyan] transition-all duration-50 z-10
          ${isMove ? 'rotate-[30deg]' : isKick ? 'rotate-[-90deg] w-1 h-14 bg-white shadow-[0_0_15px_white]' : 'rotate-[-20deg]'}`}>
             {isKick && <div className="absolute bottom-0 left-[-5px] w-10 h-10 bg-blue-200 blur-md rounded-full"></div>} {/* Kick Flare */}
        </div>

        {/* Block Shield Effect */}
        {isBlock && (
          <div className="absolute top-4 right-[-10px] w-4 h-16 border-r-2 border-blue-400 rounded-full opacity-70 shadow-[0_0_10px_blue]"></div>
        )}
      </div>
    );
  };

  const BossSprite = ({ state, facing }: { state: ActionState, facing: number }) => {
    const isAttack = state === 'PUNCH' || state === 'ATTACK_PREP';
    const isPrep = state === 'ATTACK_PREP';

    return (
      <div className={`relative w-[80px] h-[110px] transition-transform duration-75 ${facing === -1 ? 'scale-x-[-1]' : ''}`}>
        {/* Aura */}
        <div className={`absolute inset-0 bg-red-900/40 blur-2xl rounded-full transition-all ${isPrep ? 'scale-150 bg-red-600/60' : ''}`}></div>

        {/* Body (Shadowy Mass) */}
        <div className="absolute bottom-0 w-full h-full bg-slate-950 opacity-90 rounded-t-[40px] border-t-2 border-red-900/50 scale-x-90"></div>
        
        {/* Core/Eye */}
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full shadow-[0_0_20px_red] z-10 transition-all
            ${isPrep ? 'scale-150 bg-white' : ''}`}></div>

        {/* Shoulders / Arms */}
        <div className={`absolute top-10 -left-4 w-6 h-20 bg-slate-900 rounded-full border border-red-900/30 origin-top transition-all duration-300
           ${isAttack ? 'rotate-[-30deg]' : 'rotate-[10deg]'}`}></div>
        <div className={`absolute top-10 -right-4 w-6 h-20 bg-slate-900 rounded-full border border-red-900/30 origin-top transition-all duration-100
           ${isAttack ? 'rotate-[-60deg] h-32 bg-red-950' : 'rotate-[-10deg]'}`}>
              {/* Claw */}
              {isAttack && <div className="absolute bottom-0 w-full h-10 bg-red-600 blur-sm"></div>}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto mb-10 outline-none" tabIndex={0}>
      <div 
        className={`relative rounded-xl border-4 border-slate-800 overflow-hidden shadow-2xl transition-transform duration-75 
          ${uiState.shake ? 'animate-shake' : ''}`}
        style={{ height: ARENA_HEIGHT }}
      >
        {/* Hit Flash Overlay */}
        {uiState.hitFlash && <div className="absolute inset-0 bg-white/20 z-40 pointer-events-none"></div>}

        {/* --- Moving Background (Retro Wave) --- */}
        <div className="absolute inset-0 bg-void overflow-hidden">
          {/* Grid Floor */}
          <div className="absolute bottom-0 w-full h-1/2 cyber-grid opacity-30 origin-bottom"></div>
          {/* Sun/Moon */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-t from-purple-900/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </div>

        {/* --- HUD --- */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-start z-30 font-display">
           {/* Player HP */}
           <div className="w-5/12">
             <div className="flex justify-between text-xs text-cyan-300 font-bold mb-1 tracking-widest">
               <span>WARRIOR</span>
               <span>{uiState.playerHp}/{playerStats.maxHp}</span>
             </div>
             <div className="h-4 bg-slate-900/80 skew-x-[-20deg] border border-cyan-900/50 p-0.5">
               <div className="h-full bg-cyan-500 shadow-[0_0_10px_cyan] transition-all duration-100" style={{ width: `${(uiState.playerHp / playerStats.maxHp) * 100}%` }}></div>
             </div>
           </div>
           
           {/* Feedback Text */}
           <div className="w-2/12 text-center h-10 flex items-center justify-center">
             {uiState.feedback && (
               <div className="text-yellow-400 font-black text-xl italic drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] animate-bounce whitespace-nowrap z-50">
                 {uiState.feedback}
               </div>
             )}
           </div>

           {/* Boss HP */}
           <div className="w-5/12 text-right">
             <div className="flex justify-between text-xs text-red-400 font-bold mb-1 tracking-widest">
               <span>{uiState.bossHp}/{boss.hp}</span>
               <span>{boss.name}</span>
             </div>
             <div className="h-4 bg-slate-900/80 skew-x-[20deg] border border-red-900/50 p-0.5">
               <div className="h-full bg-red-600 shadow-[0_0_10px_red] transition-all duration-100 ml-auto" style={{ width: `${(uiState.bossHp / boss.hp) * 100}%` }}></div>
             </div>
           </div>
        </div>

        {/* --- Game Entities --- */}
        {uiState.gameStatus === 'PLAYING' && (
          <>
            <div id="player-root" className="absolute z-20 will-change-transform" style={{ left: 0, top: 0 }}>
              <PlayerSprite state={visualState.pState} facing={visualState.pFacing} />
            </div>
            <div id="boss-root" className="absolute z-20 will-change-transform" style={{ left: 0, top: 0 }}>
              <BossSprite state={visualState.bState} facing={visualState.bFacing} />
            </div>
          </>
        )}

        {/* --- Menu Overlay --- */}
        {uiState.gameStatus === 'MENU' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
             <h2 className="text-4xl font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2 tracking-widest">
               BOSS ENCOUNTER
             </h2>
             <p className="text-red-400 font-mono text-sm mb-8 tracking-wider uppercase border border-red-900/50 px-4 py-1 bg-red-900/10">
               target: {boss.name}
             </p>

             <button 
               onClick={startGame}
               className="group relative px-12 py-4 bg-transparent overflow-hidden"
             >
               <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
               <div className="absolute inset-0 border-2 border-cyan-500 skew-x-[-20deg] bg-cyan-900/20 group-hover:bg-cyan-500/20 transition-colors"></div>
               <span className="relative text-cyan-300 font-black text-xl tracking-[0.2em] group-hover:text-white transition-colors">
                 ENGAGE
               </span>
             </button>
             
             <div className="mt-4 text-gray-500 text-xs font-mono">
               BASE ATTACK: {Math.max(BASE_PLAYER_DMG, playerDmg)}
             </div>
          </div>
        )}

        {/* --- Result Overlay --- */}
        {(uiState.gameStatus === 'VICTORY' || uiState.gameStatus === 'DEFEAT') && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
             {uiState.gameStatus === 'VICTORY' ? (
               <div className="text-center">
                 <Trophy size={80} className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse" />
                 <h2 className="text-5xl font-black italic text-yellow-400 mb-2">VICTORY</h2>
                 <p className="text-gray-400 tracking-widest uppercase text-sm">Target Eliminated</p>
               </div>
             ) : (
               <div className="text-center">
                 <Skull size={80} className="mx-auto text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                 <h2 className="text-5xl font-black italic text-red-600 mb-2">DEFEAT</h2>
                 <p className="text-gray-400 tracking-widest uppercase text-sm">Signal Lost</p>
               </div>
             )}
             <button 
               onClick={() => setUiState(prev => ({ ...prev, gameStatus: 'MENU' }))}
               className="mt-8 px-8 py-2 border border-white/20 hover:bg-white/10 text-white rounded transition-colors font-mono"
             >
               RETURN
             </button>
          </div>
        )}

        {/* --- Control Visualizer (Bottom) --- */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 z-30 pointer-events-none">
           <div className={`flex flex-col items-center gap-1 transition-all ${uiState.activeKeys.some(k => k.includes('arrow')) ? 'scale-110 text-white' : 'text-gray-600'}`}>
              <div className="w-12 h-12 border-2 border-current rounded flex items-center justify-center font-bold text-xl">
                 <span className="text-2xl pb-2">↔</span>
              </div>
              <span className="text-[10px] font-bold tracking-wider">MOVE / BLOCK</span>
           </div>

           <div className={`flex flex-col items-center gap-1 transition-all ${uiState.activeKeys.includes('d') ? 'scale-110 text-cyan-400' : 'text-gray-600'}`}>
              <div className={`w-12 h-12 border-2 border-current rounded flex items-center justify-center font-bold text-xl bg-black/50 ${uiState.activeKeys.includes('d') ? 'bg-cyan-500/20 shadow-[0_0_15px_cyan]' : ''}`}>
                 D
              </div>
              <span className="text-[10px] font-bold tracking-wider">PUNCH</span>
           </div>

           <div className={`flex flex-col items-center gap-1 transition-all ${uiState.activeKeys.includes('b') ? 'scale-110 text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-12 h-12 border-2 border-current rounded flex items-center justify-center font-bold text-xl bg-black/50 ${uiState.activeKeys.includes('b') ? 'bg-purple-500/20 shadow-[0_0_15px_purple]' : ''}`}>
                 B
              </div>
              <span className="text-[10px] font-bold tracking-wider">KICK</span>
           </div>
        </div>

      </div>
      
      <div className="text-center mt-2 text-xs text-gray-500 font-mono">
         Click the arena to ensure controls are active.
      </div>
    </div>
  );
};