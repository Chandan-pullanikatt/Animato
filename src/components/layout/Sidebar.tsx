import React from 'react';
import { motion } from 'framer-motion';
import { Home, PlusCircle, Video, Settings, BookOpen, Users } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'create', name: 'Create Story', icon: PlusCircle },
  { id: 'stories', name: 'My Stories', icon: BookOpen },
  { id: 'videos', name: 'Videos', icon: Video },
  { id: 'characters', name: 'Characters', icon: Users },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto flex-shrink-0"
    >
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                )}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={clsx(
                  'w-5 h-5 transition-colors duration-200',
                  isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )} />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
};