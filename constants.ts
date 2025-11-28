import { Boss, Difficulty } from './types';

export const LEVEL_THRESHOLDS = [
  { days: 0, title: 'Wandering Soul', level: 1 },
  { days: 3, title: 'Awakened', level: 5 },
  { days: 7, title: 'Warrior', level: 10 },
  { days: 14, title: 'Guardian', level: 20 },
  { days: 30, title: 'Master', level: 50 },
  { days: 90, title: 'Sage', level: 99 },
];

export const DIFFICULTY_DMG: Record<Difficulty, number> = {
  [Difficulty.S]: 100, // Thunder Strike
  [Difficulty.A]: 50,  // Heavy Blow
  [Difficulty.B]: 25,  // Slash
  [Difficulty.C]: 10,  // Poke
};

export const WEEKDAY_BOSSES: Boss[] = [
  { name: 'Sloth the Behemoth', title: 'Sunday', hp: 200, attack: 15, description: 'A massive blob that slows time.', imagePlaceholder: '200/200' }, 
  { name: 'Procrastinator Rex', title: 'Monday', hp: 150, attack: 20, description: 'Feeds on "I will do it later".', imagePlaceholder: '201/201' },
  { name: 'The Anxiety Shade', title: 'Tuesday', hp: 180, attack: 25, description: 'Whispers doubts in the dark.', imagePlaceholder: '202/202' },
  { name: 'Humpback Golem', title: 'Wednesday', hp: 250, attack: 18, description: 'A sturdy wall mid-week.', imagePlaceholder: '203/203' },
  { name: 'Distraction Swarm', title: 'Thursday', hp: 160, attack: 22, description: 'Thousands of tiny buzzing notifications.', imagePlaceholder: '204/204' },
  { name: 'Lustful Siren', title: 'Friday', hp: 300, attack: 30, description: 'The strongest temptation before the weekend.', imagePlaceholder: '205/205' },
  { name: 'Chaos Hydra', title: 'Saturday', hp: 220, attack: 28, description: 'Unstructured time breeds chaos.', imagePlaceholder: '206/206' },
];

export const INITIAL_TASKS = [
  { id: '1', title: 'Deep Work (1 Hour)', difficulty: Difficulty.A, completed: false },
  { id: '2', title: 'Cold Shower', difficulty: Difficulty.B, completed: false },
  { id: '3', title: 'Read 10 Pages', difficulty: Difficulty.C, completed: false },
];