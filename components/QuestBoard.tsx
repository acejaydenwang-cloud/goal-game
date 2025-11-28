import React, { useState } from 'react';
import { Task, Difficulty } from '../types';
import { DIFFICULTY_DMG } from '../constants';
import { CheckCircle2, Circle, Plus, Trash2, Sword } from 'lucide-react';

interface QuestBoardProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ tasks, onToggleTask, onAddTask, onDeleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDiff, setNewTaskDiff] = useState<Difficulty>(Difficulty.C);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onAddTask({
      id: Date.now().toString(),
      title: newTaskTitle,
      difficulty: newTaskDiff,
      completed: false
    });
    setNewTaskTitle('');
  };

  const getDifficultyColor = (d: Difficulty) => {
    switch (d) {
      case Difficulty.S: return 'text-gold border-gold/50 bg-gold/10';
      case Difficulty.A: return 'text-purple-400 border-purple-400/50 bg-purple-400/10';
      case Difficulty.B: return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
      case Difficulty.C: return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 w-full max-w-md mx-auto mb-6">
      <h2 className="text-xl font-display font-bold text-gray-200 mb-4 flex items-center gap-2">
        <Sword className="text-magic" size={20} /> Quest Board
      </h2>

      {/* Task List */}
      <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto scrollbar-hide">
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            No active quests. Add one below to gain power.
          </div>
        )}
        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`
              relative group flex items-center justify-between p-3 rounded-lg border transition-all duration-300
              ${task.completed ? 'bg-green-900/20 border-green-900/30' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}
            `}
          >
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => onToggleTask(task.id)} className="text-gray-400 hover:text-white transition-colors">
                {task.completed ? <CheckCircle2 className="text-green-500" /> : <Circle />}
              </button>
              <div className={task.completed ? 'line-through text-gray-500' : 'text-gray-200'}>
                <div className="font-medium text-sm">{task.title}</div>
                <div className="text-[10px] text-gray-500">AP +{DIFFICULTY_DMG[task.difficulty]}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                {task.difficulty}
              </span>
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-white/10 pt-4">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New Quest..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-magic transition-colors"
        />
        <div className="flex gap-2">
          <select 
            value={newTaskDiff} 
            onChange={(e) => setNewTaskDiff(e.target.value as Difficulty)}
            className="bg-slate-900/50 border border-slate-700 rounded px-2 py-2 text-sm text-gray-300 focus:outline-none focus:border-magic"
          >
            <option value={Difficulty.C}>Rank C (+10)</option>
            <option value={Difficulty.B}>Rank B (+25)</option>
            <option value={Difficulty.A}>Rank A (+50)</option>
            <option value={Difficulty.S}>Rank S (+100)</option>
          </select>
          <button 
            type="submit" 
            className="flex-1 bg-magic/20 hover:bg-magic/40 text-magic-300 border border-magic/50 rounded flex items-center justify-center gap-2 text-sm font-bold transition-all"
          >
            <Plus size={16} /> ADD QUEST
          </button>
        </div>
      </form>
    </div>
  );
};