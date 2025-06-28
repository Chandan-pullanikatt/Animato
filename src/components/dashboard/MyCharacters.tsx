import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Edit3, Trash2, Camera, Plus, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const MyCharacters: React.FC = () => {
  const { stories } = useStoryStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStory, setFilterStory] = useState('all');

  // Extract all characters from stories
  const allCharacters = stories.flatMap(story => 
    (story.characters || []).map(character => ({
      ...character,
      story_title: story.title,
      story_theme: story.theme,
      story_id: story.id
    }))
  );

  const filteredCharacters = allCharacters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || character.role === filterRole;
    const matchesStory = filterStory === 'all' || character.story_id === filterStory;
    
    return matchesSearch && matchesRole && matchesStory;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'protagonist':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'antagonist':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'supporting':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      fantasy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'sci-fi': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      romance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      adventure: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      mystery: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      comedy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      drama: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      horror: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[theme] || colors.fantasy;
  };

  const getSelectedPhoto = (character: any) => {
    if (!character.photos || character.photos.length === 0) return null;
    return character.photos.find(photo => photo.isSelected) || character.photos[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Characters</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI-generated character profiles and photos
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredCharacters.length} characters
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Roles</option>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
            </select>

            <select
              value={filterStory}
              onChange={(e) => setFilterStory(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Stories</option>
              {stories.map(story => (
                <option key={story.id} value={story.id}>
                  {story.title}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{filteredCharacters.length} characters</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Characters Grid */}
      {filteredCharacters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.map((character, index) => {
            const selectedPhoto = getSelectedPhoto(character);
            
            return (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden relative">
                    {selectedPhoto ? (
                      <img
                        src={selectedPhoto.url}
                        alt={character.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Role Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(character.role)}`}>
                      {character.role}
                    </div>

                    {/* Photo Count */}
                    {character.photos && character.photos.length > 0 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Camera className="w-3 h-3" />
                        <span>{character.photos.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {character.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {character.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThemeColor(character.story_theme)}`}>
                        {character.story_theme}
                      </span>
                      <span className="text-xs text-gray-500">
                        {character.story_title}
                      </span>
                    </div>

                    {/* Appearance Details */}
                    {character.appearance && (
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-3">
                        <div>{character.appearance.age} years</div>
                        <div>{character.appearance.gender}</div>
                        <div>{character.appearance.ethnicity}</div>
                        <div>{character.appearance.hairColor} hair</div>
                      </div>
                    )}

                    {/* Personality Traits */}
                    {character.personality && character.personality.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {character.personality.slice(0, 3).map((trait, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300 rounded-full text-xs"
                          >
                            {trait}
                          </span>
                        ))}
                        {character.personality.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{character.personality.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Camera className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterRole !== 'all' || filterStory !== 'all' 
                ? 'No characters match your filters' 
                : 'No characters yet'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterRole !== 'all' || filterStory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create stories to generate character profiles automatically'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};