import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Play, Edit3, Plus, Trash2, Clock, Users, Video, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface Scene {
  id: string;
  title: string;
  content: string;
  characters: string[];
  setting: string;
  duration: number; // in seconds
  visualPrompt: string;
  order: number;
}

interface SceneSegmenterProps {
  story: string;
  characters: any[];
  onSegmentsCreated: (segments: Scene[]) => void;
}

export const SceneSegmenter: React.FC<SceneSegmenterProps> = ({
  story,
  characters,
  onSegmentsCreated
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [hasSegmented, setHasSegmented] = useState(false);
  const [previewScene, setPreviewScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (story && characters.length > 0 && !hasSegmented) {
      segmentStory();
    }
  }, [story, characters, hasSegmented]);

  const segmentStory = async () => {
    setIsSegmenting(true);
    
    // Simulate AI scene segmentation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const segments = analyzeStoryForScenes(story, characters);
    setScenes(segments);
    setHasSegmented(true);
    setIsSegmenting(false);
    onSegmentsCreated(segments);
  };

  const analyzeStoryForScenes = (storyText: string, characterList: any[]): Scene[] => {
    const lines = storyText.split('\n').filter(line => line.trim());
    const scenes: Scene[] = [];
    let currentScene: Partial<Scene> = {};
    let sceneContent: string[] = [];
    let sceneOrder = 0;

    lines.forEach((line, index) => {
      // Enhanced scene break detection for cinematic storytelling
      if (line.startsWith('#') || line.includes('EXT.') || line.includes('INT.') || 
          line.includes('FADE IN') || line.includes('CUT TO') ||
          line.includes('MEANWHILE') || line.includes('LATER') ||
          line.includes('SUDDENLY') || isNewSceneLine(line, sceneContent)) {
        
        // Save previous scene if it exists
        if (currentScene.title && sceneContent.length > 0) {
          scenes.push(createSceneFromContent(currentScene, sceneContent, characterList, sceneOrder));
          sceneOrder++;
        }
        
        // Start new scene
        currentScene = {
          title: generateSceneTitle(line, sceneContent, sceneOrder + 1),
        };
        sceneContent = [];
      } else if (line.trim()) {
        sceneContent.push(line);
      }
    });

    // Add final scene
    if (currentScene.title && sceneContent.length > 0) {
      scenes.push(createSceneFromContent(currentScene, sceneContent, characterList, sceneOrder));
    }

    // If no clear scene breaks found, create cinematic scenes based on story flow
    if (scenes.length === 0) {
      return createCinematicScenes(storyText, characterList);
    }

    // Ensure optimal scene count (3-6 scenes for best video experience)
    return optimizeSceneCount(scenes, characterList);
  };

  // Enhanced helper functions for cinematic scene creation
  const isNewSceneLine = (line: string, currentContent: string[]): boolean => {
    const sceneIndicators = [
      'the next day', 'hours later', 'moments later', 'back at',
      'in the distance', 'across town', 'upstairs', 'outside',
      'at the same time', 'while', 'chapter'
    ];
    
    return sceneIndicators.some(indicator => 
      line.toLowerCase().includes(indicator) && currentContent.length > 3
    );
  };

  const generateSceneTitle = (line: string, content: string[], sceneNumber: number): string => {
    if (line.startsWith('#')) {
      return line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    }
    
    if (line.includes('EXT.') || line.includes('INT.')) {
      return line.trim();
    }
    
    // Generate dynamic scene titles based on content
    const themes = extractSceneTheme(content.join(' '));
    return `${themes} - Scene ${sceneNumber}`;
  };

  const extractSceneTheme = (content: string): string => {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('action') || contentLower.includes('fight') || contentLower.includes('chase')) {
      return 'Action Sequence';
    } else if (contentLower.includes('dialogue') || contentLower.includes('conversation') || contentLower.includes('talk')) {
      return 'Character Dialogue';
    } else if (contentLower.includes('discover') || contentLower.includes('reveal') || contentLower.includes('find')) {
      return 'Discovery';
    } else if (contentLower.includes('emotional') || contentLower.includes('feel') || contentLower.includes('heart')) {
      return 'Emotional Moment';
    } else if (contentLower.includes('mysterious') || contentLower.includes('strange') || contentLower.includes('unknown')) {
      return 'Mystery';
    }
    
    return 'Story Development';
  };

  const createCinematicScenes = (storyText: string, characterList: any[]): Scene[] => {
    // Create 4-5 optimal scenes for cinematic experience
    const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const scenesCount = Math.min(Math.max(3, Math.floor(sentences.length / 3)), 6);
    const sentencesPerScene = Math.floor(sentences.length / scenesCount);
    
    const scenes: Scene[] = [];
    
    for (let i = 0; i < scenesCount; i++) {
      const startIndex = i * sentencesPerScene;
      const endIndex = i === scenesCount - 1 ? sentences.length : (i + 1) * sentencesPerScene;
      const sceneContent = sentences.slice(startIndex, endIndex).join('. ') + '.';
      
      const sceneType = determineSceneType(i, scenesCount);
      scenes.push(createSceneFromContent(
        { title: `${sceneType} - Scene ${i + 1}` },
        [sceneContent],
        characterList,
        i
      ));
    }
    
    return scenes;
  };

  const determineSceneType = (sceneIndex: number, totalScenes: number): string => {
    const sceneTypes = [
      'Opening', 'Development', 'Conflict', 'Climax', 'Resolution'
    ];
    
    if (totalScenes <= 3) {
      return ['Opening', 'Climax', 'Resolution'][sceneIndex] || 'Scene';
    } else if (totalScenes === 4) {
      return ['Opening', 'Development', 'Climax', 'Resolution'][sceneIndex] || 'Scene';
    } else {
      const typeIndex = Math.floor((sceneIndex / totalScenes) * sceneTypes.length);
      return sceneTypes[Math.min(typeIndex, sceneTypes.length - 1)];
    }
  };

  const optimizeSceneCount = (scenes: Scene[], characterList: any[]): Scene[] => {
    // If too many scenes, combine shorter ones
    if (scenes.length > 6) {
      const optimized: Scene[] = [];
      let i = 0;
      
      while (i < scenes.length) {
        const currentScene = scenes[i];
        
        // If scene is very short and not the last, combine with next
        if (currentScene.duration < 20 && i < scenes.length - 1) {
          const nextScene = scenes[i + 1];
          const combinedScene = {
            ...currentScene,
            title: `${currentScene.title} & ${nextScene.title}`,
            content: `${currentScene.content}\n\n${nextScene.content}`,
            characters: [...new Set([...currentScene.characters, ...nextScene.characters])],
            duration: currentScene.duration + nextScene.duration,
            visualPrompt: `${currentScene.visualPrompt} Transitions to ${nextScene.visualPrompt.toLowerCase()}`
          };
          optimized.push(combinedScene);
          i += 2; // Skip both scenes
        } else {
          optimized.push(currentScene);
          i++;
        }
      }
      
      return optimized;
    }
    
    return scenes;
  };

  const createSceneFromContent = (
    sceneData: Partial<Scene>, 
    content: string[], 
    characterList: any[], 
    order: number
  ): Scene => {
    const fullContent = content.join('\n');
    const charactersInScene = characterList
      .filter(char => fullContent.toLowerCase().includes(char.name.toLowerCase()))
      .map(char => char.name);

    return {
      id: `scene-${order}`,
      title: sceneData.title || `Scene ${order + 1}`,
      content: fullContent,
      characters: charactersInScene,
      setting: extractSetting(fullContent),
      duration: Math.max(15, Math.min(60, fullContent.split(' ').length / 3)), // 3 words per second
      visualPrompt: generateVisualPrompt(fullContent, charactersInScene),
      order
    };
  };

  const extractSetting = (content: string): string => {
    const settings = [
      'forest', 'castle', 'city', 'home', 'office', 'school', 'park', 'beach',
      'mountain', 'space station', 'laboratory', 'restaurant', 'street', 'room'
    ];
    
    const contentLower = content.toLowerCase();
    const foundSetting = settings.find(setting => contentLower.includes(setting));
    return foundSetting || 'indoor scene';
  };

  const generateVisualPrompt = (content: string, characters: string[]): string => {
    const actions = extractActions(content);
    const setting = extractSetting(content);
    const characterList = characters.length > 0 ? characters.join(' and ') : 'characters';
    
    return `${characterList} in ${setting}, ${actions}. Cinematic lighting, detailed animation.`;
  };

  const extractActions = (content: string): string => {
    const actionWords = [
      'walking', 'talking', 'fighting', 'running', 'sitting', 'standing',
      'looking', 'searching', 'discovering', 'meeting', 'arguing', 'laughing'
    ];
    
    const contentLower = content.toLowerCase();
    const foundActions = actionWords.filter(action => contentLower.includes(action));
    return foundActions.length > 0 ? foundActions.join(', ') : 'interacting';
  };

  const chunkStoryByLength = (text: string, wordsPerChunk: number): string[] => {
    const words = text.split(' ');
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }
    
    return chunks;
  };

  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    const updatedScenes = scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    setScenes(updatedScenes);
    onSegmentsCreated(updatedScenes);
  };

  const addNewScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `New Scene ${scenes.length + 1}`,
      content: 'Enter scene content here...',
      characters: [],
      setting: 'indoor scene',
      duration: 30,
      visualPrompt: 'A new scene with characters interacting.',
      order: scenes.length
    };
    
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    onSegmentsCreated(updatedScenes);
    setEditingScene(newScene.id);
  };

  const removeScene = (sceneId: string) => {
    const updatedScenes = scenes.filter(scene => scene.id !== sceneId);
    setScenes(updatedScenes);
    onSegmentsCreated(updatedScenes);
  };

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0);
  };

  const handlePreviewScene = (scene: Scene) => {
    setPreviewScene(scene);
  };

  if (isSegmenting) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Eye className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Segmenting Story
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI is breaking your story into optimal scenes for video generation...
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full animate-pulse w-2/3" />
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
            Scene Segments
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {scenes.length} scenes • {Math.floor(getTotalDuration() / 60)}:{(getTotalDuration() % 60).toString().padStart(2, '0')} total duration
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={segmentStory}>
            <Eye className="w-4 h-4 mr-2" />
            Re-segment
          </Button>
          <Button size="sm" onClick={addNewScene}>
            <Plus className="w-4 h-4 mr-2" />
            Add Scene
          </Button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        {scenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {scene.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{scene.duration}s</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{scene.characters.length} characters</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingScene(
                        editingScene === scene.id ? null : scene.id
                      )}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScene(scene.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Scene Content */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scene Content
                  </label>
                  {editingScene === scene.id ? (
                    <textarea
                      value={scene.content}
                      onChange={(e) => updateScene(scene.id, { content: e.target.value })}
                      className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                      {scene.content}
                    </p>
                  )}
                </div>

                {/* Characters and Setting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Characters
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scene.characters.map((character, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 rounded-full text-xs"
                        >
                          {character}
                        </span>
                      ))}
                      {scene.characters.length === 0 && (
                        <span className="text-xs text-gray-400">No characters detected</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Setting
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {scene.setting}
                    </p>
                  </div>
                </div>

                {/* Visual Prompt */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Visual Prompt
                  </label>
                  {editingScene === scene.id ? (
                    <textarea
                      value={scene.visualPrompt}
                      onChange={(e) => updateScene(scene.id, { visualPrompt: e.target.value })}
                      className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                      "{scene.visualPrompt}"
                    </p>
                  )}
                </div>

                {/* Preview Button */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handlePreviewScene(scene)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Preview Scene
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {scenes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Scenes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The AI couldn't segment your story into scenes. Try adding scene breaks or headings.
            </p>
            <Button onClick={addNewScene}>
              <Plus className="w-4 h-4 mr-2" />
              Add Scene Manually
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {scenes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Video Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Scenes:</span>
                <div className="font-semibold">{scenes.length}</div>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="font-semibold">
                  {Math.floor(getTotalDuration() / 60)}:{(getTotalDuration() % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Characters:</span>
                <div className="font-semibold">
                  {new Set(scenes.flatMap(s => s.characters)).size}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Settings:</span>
                <div className="font-semibold">
                  {new Set(scenes.map(s => s.setting)).size}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scene Preview Modal */}
      <Modal
        isOpen={!!previewScene}
        onClose={() => setPreviewScene(null)}
        title={previewScene?.title}
        maxWidth="4xl"
      >
        {previewScene && (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Scene Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    {scenes.findIndex(s => s.id === previewScene.id) + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {previewScene.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{previewScene.duration}s</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{previewScene.characters.length} characters</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Setting: {previewScene.setting}
                </div>
              </div>

              {/* Scene Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Scene Content
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {previewScene.content}
                    </p>
                  </div>
                </div>

                {/* Characters */}
                {previewScene.characters.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Characters in Scene
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {previewScene.characters.map((character, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 rounded-full text-sm font-medium"
                        >
                          {character}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Prompt */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    AI Visual Prompt
                  </h4>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 italic">
                      "{previewScene.visualPrompt}"
                    </p>
                  </div>
                </div>

                {/* Video Preview Placeholder */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Video Preview
                  </h4>
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Scene Preview</p>
                      <p className="text-sm opacity-75">
                        Video will be generated based on this scene content
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingScene(previewScene.id);
                    setPreviewScene(null);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Scene
                </Button>
                <Button onClick={() => setPreviewScene(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};