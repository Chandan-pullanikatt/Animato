import React from 'react';
import { motion } from 'framer-motion';
import { StoryLength } from '../../types';
import { Clock } from 'lucide-react';

interface StoryLengthSelectorProps {
  value: StoryLength;
  onChange: (length: StoryLength) => void;
}

const lengths = [
  { id: 'short' as const, name: 'Short', duration: '1-2 min', description: 'Quick story' },
  { id: 'medium' as const, name: 'Medium', duration: '3-5 min', description: 'Detailed narrative' },
  { id: 'long' as const, name: 'Long', duration: '6-10 min', description: 'Epic adventure' },
];

export const StoryLengthSelector: React.FC<StoryLengthSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Video Length
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {lengths.map((length) => {
          const isSelected = value === length.id;
          
          return (
            <motion.button
              key={length.id}
              onClick={() => onChange(length.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{length.name}</span>
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                {length.duration}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {length.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};