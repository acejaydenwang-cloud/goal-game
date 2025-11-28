export enum Difficulty {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C'
}

export interface Task {
  id: string;
  title: string;
  difficulty: Difficulty;
  completed: boolean;
}

export interface PlayerStats {
  streak: number;
  level: number;
  hp: number;
  maxHp: number;
  lastRelapse: number; // timestamp
}

export interface Boss {
  name: string;
  title: string;
  hp: number;
  attack: number; // Damage boss deals per turn
  description: string;
  imagePlaceholder: string;
}

export interface GameState {
  stats: PlayerStats;
  tasks: Task[];
  lastLoginDate: string; // YYYY-MM-DD to track daily resets
  inventory: string[];
}