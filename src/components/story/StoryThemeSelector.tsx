import React from 'react';
import { motion } from 'framer-motion';
import { StoryTheme } from '../../types';
import { Wand2, Rocket, Heart, Map, Search, Smile, Drama, Ghost } from 'lucide-react';

interface StoryThemeSelectorProps {
  value: StoryTheme;
  onChange: (theme: StoryTheme) => void;
}

const themes = [
  { id: 'fantasy' as const, name: 'Fantasy', icon: Wand2, color: 'from-purple-500 to-pink-500' },
  { id: 'sci-fi' as const, name: 'Sci-Fi', icon: Rocket, color: 'from-blue-500 to-cyan-500' },
  { id: 'romance' as const, name: 'Romance', icon: Heart, color: 'from-pink-500 to-red-500' },
  { id: 'adventure' as const, name: 'Adventure', icon: Map, color: 'from-green-500 to-teal-500' },
  { id: 'mystery' as const, name: 'Mystery', icon: Search, color: 'from-gray-500 to-slate-500' },
  { id: 'comedy' as const, name: 'Comedy', icon: Smile, color: 'from-yellow-500 to-orange-500' },
  { id: 'drama' as const, name: 'Drama', icon: Drama, color: 'from-indigo-500 to-purple-500' },
  { id: 'horror' as const, name: 'Horror', icon: Ghost, color: 'from-red-500 to-black' },
];

export const StoryThemeSelector: React.FC<StoryThemeSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Story Theme
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = value === theme.id;
          
          return (
            <motion.button
              key={theme.id}
              onClick={() => onChange(theme.id)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${theme.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {theme.name}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};