import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Edit3, Check, X, Plus, Camera, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { characterService } from '../../lib/characterService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  description: string;
  personality: string[];
  appearance: {
    age: string;
    gender: string;
    ethnicity: string;
    hairColor: string;
    eyeColor: string;
    style: string;
  };
  dialogueLines: string[];
  photos: Array<{
    url: string;
    provider: string;
    style: string;
    isSelected?: boolean;
  }>;
}

interface CharacterExtractorProps {
  story: string;
  onCharactersExtracted: (characters: Character[]) => void;
}

export const CharacterExtractor: React.FC<CharacterExtractorProps> = ({
  story,
  onCharactersExtracted
}) => {
  const { user } = useAuthStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingPhotos, setIsGeneratingPhotos] = useState<string | null>(null);
  const [isGeneratingAllPhotos, setIsGeneratingAllPhotos] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState<{
    current: number;
    total: number;
    characterName: string;
  } | null>(null);

  useEffect(() => {
    if (story && !hasExtracted) {
      extractCharacters();
    }
  }, [story, hasExtracted]);

  const extractCharacters = async () => {
    setIsExtracting(true);
    
    try {
      // Simulate AI character extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const extractedCharacters = analyzeStoryForCharacters(story);
      setCharacters(extractedCharacters);
      setHasExtracted(true);
      onCharactersExtracted(extractedCharacters);

      toast.success(`Extracted ${extractedCharacters.length} characters successfully!`);
    } catch (error) {
      console.error('Character extraction error:', error);
      toast.error('Failed to extract characters');
    } finally {
      setIsExtracting(false);
    }
  };

  const analyzeStoryForCharacters = (storyText: string): Character[] => {
    // Extract character names from dialogue and descriptions
    const characterNames = new Set<string>();
    const lines = storyText.split('\n');
    
    // Look for character names in dialogue format
    lines.forEach(line => {
      const dialogueMatch = line.match(/^\*\*([A-Z][A-Z\s]+)\*\*/);
      if (dialogueMatch) {
        characterNames.add(dialogueMatch[1].trim());
      }
      
      // Look for character names in descriptions - be more selective
      const descriptionMatches = line.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g);
      if (descriptionMatches) {
        descriptionMatches.forEach(name => {
          // Only add names that appear in character-like contexts
          if (name.length > 2 && 
              !['The', 'And', 'But', 'For', 'With', 'Scene', 'Act', 'Chapter', 'Then', 'When', 'Where', 'Why', 'How'].includes(name) &&
              (line.toLowerCase().includes('said') || 
               line.toLowerCase().includes('replied') || 
               line.toLowerCase().includes('asked') ||
               line.toLowerCase().includes('whispered') ||
               line.toLowerCase().includes('shouted') ||
               line.toLowerCase().includes('thought') ||
               line.includes(name + ' was') ||
               line.includes(name + ' had') ||
               line.includes(name + ' could') ||
               line.includes(name + ' would') ||
               line.includes(name + "'s"))) {
            characterNames.add(name);
          }
        });
      }
    });

    // Filter out very common words and keep only meaningful character names
    const filteredNames = Array.from(characterNames).filter(name => {
      const lowerName = name.toLowerCase();
      return !['chapter', 'scene', 'part', 'book', 'story', 'tale', 'end', 'beginning', 
               'morning', 'evening', 'night', 'day', 'time', 'place', 'world', 'life',
               'death', 'love', 'hope', 'fear', 'joy', 'pain', 'voice', 'eyes', 'hand',
               'face', 'heart', 'mind', 'soul', 'body', 'room', 'house', 'door', 'window'].includes(lowerName);
    });

    // If we found fewer than 2 characters, add some default main characters
    if (filteredNames.length < 2) {
      if (!filteredNames.includes('Protagonist')) {
        filteredNames.unshift('Protagonist');
      }
      if (filteredNames.length < 2 && !filteredNames.includes('Supporting Character')) {
        filteredNames.push('Supporting Character');
      }
    }

    // Generate character profiles - limit to what we actually found (max 8 for performance)
    const characters: Character[] = filteredNames.slice(0, 8).map((name, index) => {
      const dialogueLines = lines
        .filter(line => line.includes(name))
        .slice(0, 3);

      return {
        id: `char-${index}`,
        name,
        role: index === 0 ? 'protagonist' : index === 1 ? 'supporting' : 'supporting',
        description: generateCharacterDescription(name, storyText),
        personality: generatePersonalityTraits(name, storyText),
        appearance: generateAppearance(name, storyText),
        dialogueLines,
        photos: []
      };
    });

    return characters;
  };

  const generateCharacterDescription = (name: string, story: string): string => {
    const descriptions = [
      `${name} is a complex character whose journey drives much of the story's emotional core.`,
      `${name} brings unique perspective and depth to the narrative through their actions and decisions.`,
      `${name} serves as a catalyst for important plot developments and character growth.`,
      `${name} represents key themes in the story through their personal struggles and triumphs.`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const generatePersonalityTraits = (name: string, story: string): string[] => {
    const allTraits = [
      'brave', 'intelligent', 'compassionate', 'determined', 'loyal', 'creative',
      'ambitious', 'mysterious', 'charismatic', 'resilient', 'wise', 'adventurous',
      'cautious', 'optimistic', 'analytical', 'empathetic', 'independent', 'curious'
    ];
    
    return allTraits.sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  const generateAppearance = (name: string, story: string) => {
    const appearances = {
      ages: ['25', '30', '35', '40', '28', '32'],
      genders: ['male', 'female'],
      ethnicities: ['caucasian', 'african', 'asian', 'hispanic', 'middle-eastern', 'mixed'],
      hairColors: ['brown', 'black', 'blonde', 'red', 'gray', 'auburn'],
      eyeColors: ['brown', 'blue', 'green', 'hazel', 'gray', 'amber'],
      styles: ['casual', 'professional', 'artistic', 'athletic', 'elegant', 'bohemian']
    };

    return {
      age: appearances.ages[Math.floor(Math.random() * appearances.ages.length)],
      gender: appearances.genders[Math.floor(Math.random() * appearances.genders.length)],
      ethnicity: appearances.ethnicities[Math.floor(Math.random() * appearances.ethnicities.length)],
      hairColor: appearances.hairColors[Math.floor(Math.random() * appearances.hairColors.length)],
      eyeColor: appearances.eyeColors[Math.floor(Math.random() * appearances.eyeColors.length)],
      style: appearances.styles[Math.floor(Math.random() * appearances.styles.length)]
    };
  };

  const generateAllCharacterPhotos = async () => {
    if (characters.length === 0) {
      toast.error('No characters available for photo generation');
      return;
    }

    setIsGeneratingAllPhotos(true);
    setBulkGenerationProgress({ current: 0, total: characters.length, characterName: '' });

    try {
      const updatedCharacters = [...characters];
      
      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        
        setBulkGenerationProgress({
          current: i + 1,
          total: characters.length,
          characterName: character.name
        });

        try {
          console.log(`🎨 Generating photos for character ${i + 1}/${characters.length}: ${character.name}`);
          
          const photos = await characterService.generateCharacterPhotos({
            name: character.name,
            description: character.description,
            appearance: character.appearance,
            style: 'realistic'
          });

          updatedCharacters[i] = {
            ...character,
            photos: photos.map((photo, index) => ({ ...photo, isSelected: index === 0 }))
          };

          // Update state progressively so user can see progress
          setCharacters([...updatedCharacters]);
          onCharactersExtracted([...updatedCharacters]);

          if (photos.length > 0) {
            console.log(`✅ Generated ${photos.length} photos for ${character.name}`);
          }

          // Small delay between characters to prevent overwhelming the API
          if (i < characters.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          console.error(`❌ Failed to generate photos for ${character.name}:`, error);
          // Continue with next character even if one fails
        }
      }

      const totalPhotosGenerated = updatedCharacters.reduce((total, char) => total + char.photos.length, 0);
      toast.success(`🎉 Bulk generation complete! Generated ${totalPhotosGenerated} photos for ${characters.length} characters`);

    } catch (error: any) {
      console.error('❌ Bulk photo generation error:', error);
      toast.error('Bulk photo generation failed');
    } finally {
      setIsGeneratingAllPhotos(false);
      setBulkGenerationProgress(null);
    }
  };

  const generateCharacterPhotos = async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    setIsGeneratingPhotos(characterId);
    
    try {
      console.log('🎨 Generating photos for:', character.name);
      
      const photos = await characterService.generateCharacterPhotos({
        name: character.name,
        description: character.description,
        appearance: character.appearance,
        style: 'realistic'
      });

      const updatedCharacters = characters.map(char =>
        char.id === characterId 
          ? { ...char, photos: photos.map((photo, index) => ({ ...photo, isSelected: index === 0 })) }
          : char
      );
      
      setCharacters(updatedCharacters);
      onCharactersExtracted(updatedCharacters);
      
      if (photos.length > 0) {
        toast.success(`Generated ${photos.length} photos for ${character.name}`);
      } else {
        toast.error(`Failed to generate photos for ${character.name}`);
      }
    } catch (error: any) {
      console.error('Photo generation error:', error);
      toast.error(`Failed to generate photos for ${character.name}: ${error.message}`);
    } finally {
      setIsGeneratingPhotos(null);
    }
  };

  const selectCharacterPhoto = (characterId: string, photoIndex: number) => {
    const updatedCharacters = characters.map(char =>
      char.id === characterId 
        ? {
            ...char,
            photos: char.photos.map((photo, index) => ({
              ...photo,
              isSelected: index === photoIndex
            }))
          }
        : char
    );
    
    setCharacters(updatedCharacters);
    onCharactersExtracted(updatedCharacters);
  };

  const updateCharacter = (characterId: string, updates: Partial<Character>) => {
    const updatedCharacters = characters.map(char =>
      char.id === characterId ? { ...char, ...updates } : char
    );
    setCharacters(updatedCharacters);
    onCharactersExtracted(updatedCharacters);
  };

  const addNewCharacter = () => {
    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      role: 'supporting',
      description: 'A new character in the story.',
      personality: ['mysterious'],
      appearance: generateAppearance('New Character', story),
      dialogueLines: [],
      photos: []
    };
    
    const updatedCharacters = [...characters, newCharacter];
    setCharacters(updatedCharacters);
    onCharactersExtracted(updatedCharacters);
    setEditingCharacter(newCharacter.id);
  };

  const removeCharacter = (characterId: string) => {
    const updatedCharacters = characters.filter(char => char.id !== characterId);
    setCharacters(updatedCharacters);
    onCharactersExtracted(updatedCharacters);
  };

  if (isExtracting) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Users className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Extracting Characters
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI is analyzing your story to identify and create character profiles...
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Character Profiles
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI has extracted {characters.length} characters from your story
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={extractCharacters}>
            <Sparkles className="w-4 h-4 mr-2" />
            Re-extract
          </Button>
          <Button size="sm" onClick={addNewCharacter}>
            <Plus className="w-4 h-4 mr-2" />
            Add Character
          </Button>
        </div>
      </div>

      {/* Bulk Photo Generation */}
      {characters.length > 0 && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                  🎨 Bulk Photo Generation
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Generate photos for all {characters.length} characters at once using AI
                </p>
              </div>
              <Button
                onClick={generateAllCharacterPhotos}
                disabled={isGeneratingAllPhotos || isGeneratingPhotos !== null}
                isLoading={isGeneratingAllPhotos}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isGeneratingAllPhotos ? 'Generating...' : 'Generate All Photos'}
              </Button>
            </div>

            {/* Bulk Generation Progress */}
            {bulkGenerationProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-purple-700 dark:text-purple-300 mb-2">
                  <span>Generating photos for: {bulkGenerationProgress.characterName}</span>
                  <span>{bulkGenerationProgress.current} of {bulkGenerationProgress.total}</span>
                </div>
                <div className="bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(bulkGenerationProgress.current / bulkGenerationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Characters Grid */}
      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        character.role === 'protagonist' 
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                          : character.role === 'antagonist'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        {editingCharacter === character.id ? (
                          <Input
                            value={character.name}
                            onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                            className="text-lg font-semibold"
                          />
                        ) : (
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {character.name}
                          </h4>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          character.role === 'protagonist' 
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                            : character.role === 'antagonist'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {character.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCharacter(
                          editingCharacter === character.id ? null : character.id
                        )}
                      >
                        {editingCharacter === character.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Edit3 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCharacter(character.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Character Photos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Character Photos
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateCharacterPhotos(character.id)}
                        disabled={isGeneratingPhotos === character.id || isGeneratingAllPhotos}
                        isLoading={isGeneratingPhotos === character.id}
                      >
                        {isGeneratingPhotos === character.id ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3 mr-1" />
                        )}
                        Generate
                      </Button>
                    </div>
                    
                    {character.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {character.photos.map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              photo.isSelected 
                                ? 'border-primary-500 ring-2 ring-primary-200' 
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                            onClick={() => selectCharacterPhoto(character.id, photoIndex)}
                          >
                            <img
                              src={photo.url}
                              alt={`${character.name} photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder
                                e.currentTarget.src = `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop`;
                              }}
                            />
                            {photo.isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
                              {photo.provider}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            {isGeneratingPhotos === character.id ? 'Generating...' : 
                             isGeneratingAllPhotos ? 'In queue...' : 
                             'Click Generate to create photos'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Appearance Details */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Appearance
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <div>Age: {character.appearance.age}</div>
                      <div>Gender: {character.appearance.gender}</div>
                      <div>Ethnicity: {character.appearance.ethnicity}</div>
                      <div>Hair: {character.appearance.hairColor}</div>
                      <div>Eyes: {character.appearance.eyeColor}</div>
                      <div>Style: {character.appearance.style}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    {editingCharacter === character.id ? (
                      <textarea
                        value={character.description}
                        onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                        className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {character.description}
                      </p>
                    )}
                  </div>

                  {/* Personality Traits */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personality
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {character.personality.map((trait, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300 rounded-full text-xs"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Characters Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The AI couldn't extract characters from your story. Try adding character names or dialogue.
            </p>
            <Button onClick={addNewCharacter}>
              <Plus className="w-4 h-4 mr-2" />
              Add Character Manually
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Photo Generation Status */}
      {(isGeneratingPhotos || isGeneratingAllPhotos) && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {isGeneratingAllPhotos ? 'Bulk Generating Photos' : 'Generating Photos'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isGeneratingAllPhotos 
                  ? `${bulkGenerationProgress?.current || 0} of ${bulkGenerationProgress?.total || 0} characters`
                  : 'Creating character images...'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};