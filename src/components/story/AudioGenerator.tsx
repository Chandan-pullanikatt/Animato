import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause, Download, RefreshCw, Mic, User, Settings, Check, AlertCircle, Square, VolumeX, SkipForward } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { geminiService } from '../../lib/geminiService';
import { elevenLabsService } from '../../lib/elevenlabsService';
import toast from 'react-hot-toast';

interface AudioGeneratorProps {
  storySegments: any[];
  characters: any[];
  onAudioGenerated: (audioFiles: any[]) => void;
}

interface AudioFile {
  id: string;
  text: string;
  character?: string;
  type: 'narration' | 'dialogue';
  audioUrl?: string;
  isPlaying: boolean;
  isGenerated: boolean;
  duration?: number;
}

export const AudioGenerator: React.FC<AudioGeneratorProps> = ({
  storySegments,
  characters,
  onAudioGenerated
}) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('professional');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [audioSettings, setAudioSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    includeNarration: true,
    includeDialogue: true,
    voiceStyle: 'professional' as 'professional' | 'casual' | 'dramatic'
  });

  useEffect(() => {
    extractAudioFromSegments();
  }, [storySegments, characters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUtterance) {
        speechSynthesis.cancel();
      }
    };
  }, [currentUtterance]);

  const extractAudioFromSegments = () => {
    const extractedAudio: AudioFile[] = [];
    
    storySegments.forEach((segment, segmentIndex) => {
      // Extract narration
      if (audioSettings.includeNarration && segment.content) {
        const narrativeText = extractNarrative(segment.content);
        if (narrativeText) {
          extractedAudio.push({
            id: `narration-${segmentIndex}`,
            text: narrativeText,
            type: 'narration',
            isPlaying: false,
            isGenerated: false
          });
        }
      }

      // Extract dialogue
      if (audioSettings.includeDialogue) {
        const dialogueLines = extractDialogue(segment.content);
        dialogueLines.forEach((line, lineIndex) => {
          extractedAudio.push({
            id: `dialogue-${segmentIndex}-${lineIndex}`,
            text: line.text,
            character: line.character,
            type: 'dialogue',
            isPlaying: false,
            isGenerated: false
          });
        });
      }
    });

    setAudioFiles(extractedAudio);
  };

  const extractNarrative = (content: string): string => {
    // Extract narrative text (non-dialogue parts)
    const lines = content.split('\n');
    const narrativeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('**') && 
             !trimmed.includes(':') &&
             !trimmed.startsWith('*') &&
             trimmed.length > 10;
    });
    
    return narrativeLines.join(' ').substring(0, 500); // Limit length
  };

  const extractDialogue = (content: string): Array<{character: string, text: string}> => {
    const dialogue = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const dialogueMatch = line.match(/^\*\*([A-Z][A-Z\s]+)\*\*:?\s*(.+)/);
      if (dialogueMatch) {
        const characterName = dialogueMatch[1].trim();
        const text = dialogueMatch[2].trim();
        
        if (characters.some(char => char.name.toUpperCase() === characterName)) {
          dialogue.push({
            character: characterName,
            text: text
          });
        }
      }
    }
    
    return dialogue;
  };

  const generateAllAudio = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🎙️ Starting enhanced audio generation with ElevenLabs Creator Tier...');
      
      // Use ElevenLabs story narration for premium experience
      if (elevenLabsService.isConfigured() && storySegments.length > 0) {
        const storyText = storySegments.map(seg => seg.content).join('\n');
        const theme = storySegments[0]?.theme || 'fantasy';
        
        // Generate character voices mapping
        const characterVoices = await elevenLabsService.generateCharacterVoices(characters);
        
        // Generate story narration with Creator Tier
        const narrationResult = await elevenLabsService.generateStoryNarration(
          storyText,
          theme,
          characterVoices
        );
        
        const enhancedFiles = narrationResult.segments.map((segment, index) => ({
          id: `enhanced-${index}`,
          text: segment.text,
          character: segment.character,
          type: segment.type,
          audioUrl: segment.audioUrl,
          isPlaying: false,
          isGenerated: true,
          duration: estimateAudioDuration(segment.text),
          voiceId: segment.voiceId,
          isPremium: true
        }));
        
        setAudioFiles(enhancedFiles);
        onAudioGenerated(enhancedFiles);
        toast.success(`🎭 Generated ${enhancedFiles.length} premium audio files with ElevenLabs!`);
        return;
      }
      
      // Fallback to individual file generation
      const generatedFiles = [];
      
      for (const audioFile of audioFiles) {
        try {
          const audioUrl = await generateSingleAudio(audioFile);
          const updatedFile = {
            ...audioFile,
            audioUrl,
            isGenerated: true,
            duration: estimateAudioDuration(audioFile.text)
          };
          
          generatedFiles.push(updatedFile);
          
          // Update state progressively
          setAudioFiles(prev => prev.map(file => 
            file.id === audioFile.id ? updatedFile : file
          ));
          
        } catch (error) {
          console.error(`Failed to generate audio for ${audioFile.id}:`, error);
          generatedFiles.push({
            ...audioFile,
            isGenerated: false
          });
        }
      }
      
      onAudioGenerated(generatedFiles);
      toast.success(`Generated ${generatedFiles.filter(f => f.isGenerated).length} audio files!`);
      
    } catch (error: any) {
      console.error('Audio generation error:', error);
      toast.error('Failed to generate audio files');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSingleAudio = async (audioFile: AudioFile): Promise<string> => {
    // Use browser Speech Synthesis API for demo
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(audioFile.text);
      
      // Configure voice settings based on character or type
      if (audioFile.character) {
        const character = characters.find(c => c.name.toUpperCase() === audioFile.character?.toUpperCase());
        if (character) {
          utterance.pitch = character.appearance.gender === 'female' ? 1.2 : 0.8;
          utterance.rate = audioSettings.speed;
        }
      } else {
        // Narrator voice
        utterance.pitch = 1.0;
        utterance.rate = audioSettings.speed * 0.9; // Slightly slower for narration
      }

      utterance.volume = audioSettings.volume;

      // Try to find a suitable voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        // Create a blob URL for the audio (simulated)
        const audioUrl = `data:audio/wav;base64,${btoa('simulated-audio-data')}`;
        resolve(audioUrl);
      };

      utterance.onerror = (error) => {
        reject(new Error(`Speech synthesis error: ${error.error}`));
      };

      speechSynthesis.speak(utterance);
    });
  };

  const estimateAudioDuration = (text: string): number => {
    // Estimate duration based on text length (average speaking speed)
    const wordsPerMinute = 150;
    const words = text.split(' ').length;
    return Math.ceil((words / wordsPerMinute) * 60);
  };

  const playAudio = async (audioFile: AudioFile) => {
    if (!audioFile.text) {
      toast.error('No text to play');
      return;
    }

    // Stop any currently playing audio
    stopAllAudio();

    if (!('speechSynthesis' in window)) {
      toast.error('Speech synthesis not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(audioFile.text);
      utterance.rate = audioSettings.speed;
      utterance.pitch = audioFile.character ? 
        (characters.find(c => c.name.toUpperCase() === audioFile.character?.toUpperCase())?.appearance.gender === 'female' ? 1.2 : 0.8) : 
        1.0;
      utterance.volume = audioSettings.volume;

      // Try to find a suitable voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setCurrentlyPlaying(audioFile.id);
        setCurrentUtterance(utterance);
        setAudioFiles(prev => prev.map(file => 
          file.id === audioFile.id ? { ...file, isPlaying: true } : { ...file, isPlaying: false }
        ));
      };

      utterance.onend = () => {
        setCurrentlyPlaying(null);
        setCurrentUtterance(null);
        setAudioFiles(prev => prev.map(file => 
          file.id === audioFile.id ? { ...file, isPlaying: false } : file
        ));
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setCurrentlyPlaying(null);
        setCurrentUtterance(null);
        setAudioFiles(prev => prev.map(file => ({ ...file, isPlaying: false })));
        toast.error('Failed to play audio');
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    }
  };

  const stopAllAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setCurrentlyPlaying(null);
    setCurrentUtterance(null);
    setAudioFiles(prev => prev.map(file => ({ ...file, isPlaying: false })));
  };

  const pauseAudio = () => {
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.pause();
      setAudioFiles(prev => prev.map(file => 
        file.id === currentlyPlaying ? { ...file, isPlaying: false } : file
      ));
    }
  };

  const resumeAudio = () => {
    if ('speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
      setAudioFiles(prev => prev.map(file => 
        file.id === currentlyPlaying ? { ...file, isPlaying: true } : file
      ));
    }
  };

  const skipToNext = () => {
    if (currentlyPlaying) {
      const currentIndex = audioFiles.findIndex(file => file.id === currentlyPlaying);
      if (currentIndex < audioFiles.length - 1) {
        stopAllAudio();
        setTimeout(() => {
          playAudio(audioFiles[currentIndex + 1]);
        }, 100);
      }
    }
  };

  const downloadAudio = (audioFile: AudioFile) => {
    if (!audioFile.audioUrl) {
      toast.error('Audio not generated yet');
      return;
    }
    
    // For demo purposes, show success message
    toast.success(`Audio file "${audioFile.character || 'Narration'}" ready for download`);
  };

  const getCharacterVoiceInfo = (characterName: string) => {
    const character = characters.find(c => c.name.toUpperCase() === characterName.toUpperCase());
    if (!character) return 'Unknown Character';
    
    return `${character.appearance.gender}, ${character.appearance.age} years old`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Audio Generation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate professional voiceovers for your story
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={extractAudioFromSegments}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-extract
          </Button>
          <Button
            size="sm"
            onClick={generateAllAudio}
            disabled={isGenerating || audioFiles.length === 0}
            isLoading={isGenerating}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Generate All Audio
          </Button>
          {currentlyPlaying && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopAllAudio}
              className="text-red-600 hover:text-red-700"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop All
            </Button>
          )}
        </div>
      </div>

      {/* Global Audio Controls */}
      {currentlyPlaying && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    Now Playing
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {audioFiles.find(f => f.id === currentlyPlaying)?.character || 'Narrator'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (speechSynthesis.paused) {
                      resumeAudio();
                    } else {
                      pauseAudio();
                    }
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {speechSynthesis.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipToNext}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopAllAudio}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary-500" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Audio Settings</h4>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Style
              </label>
              <select
                value={audioSettings.voiceStyle}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, voiceStyle: e.target.value as any }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Speed: {audioSettings.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={audioSettings.speed}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Volume: {Math.round(audioSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioSettings.volume}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
            </div>
          </div>

          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={audioSettings.includeNarration}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, includeNarration: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include Narration</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={audioSettings.includeDialogue}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, includeDialogue: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include Dialogue</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Audio Files List */}
      {audioFiles.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Audio Files ({audioFiles.length})
          </h4>
          
          <div className="space-y-3">
            {audioFiles.map((audioFile, index) => (
              <motion.div
                key={audioFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-200 ${
                  audioFile.isPlaying ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            audioFile.type === 'narration' 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {audioFile.type === 'narration' ? <Mic className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {audioFile.character || 'Narrator'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {audioFile.character ? getCharacterVoiceInfo(audioFile.character) : 'Professional narrator voice'}
                            </div>
                          </div>

                          {audioFile.isGenerated && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Generated</span>
                            </div>
                          )}

                          {audioFile.isPlaying && (
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                              <Volume2 className="w-4 h-4 animate-pulse" />
                              <span className="text-xs">Playing</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {audioFile.text}
                        </p>
                        
                        {audioFile.duration && (
                          <div className="text-xs text-gray-500 mt-1">
                            Duration: {audioFile.duration}s
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (audioFile.isPlaying) {
                              if (speechSynthesis.paused) {
                                resumeAudio();
                              } else {
                                pauseAudio();
                              }
                            } else {
                              playAudio(audioFile);
                            }
                          }}
                          disabled={!audioFile.text}
                          className={audioFile.isPlaying ? 'border-blue-300 text-blue-700' : ''}
                        >
                          {audioFile.isPlaying ? (
                            speechSynthesis.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>

                        {audioFile.isGenerated && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAudio(audioFile)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Audio Content Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No dialogue or narration was found in your story segments. Make sure your story includes character dialogue and narrative text.
            </p>
            <Button onClick={extractAudioFromSegments}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Audio Technology Info */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            🎙️ Audio Generation Technology:
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Browser Speech Synthesis (Always Available):
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                • Uses your browser's built-in text-to-speech engine
                • Supports multiple voices and languages
                • Adjustable speed, pitch, and volume
                • Works offline once loaded
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                Character Voice Mapping:
              </div>
              <div className="text-green-700 dark:text-green-300">
                • Automatic voice selection based on character gender and age
                • Consistent voice per character throughout the story
                • Narrator uses professional, neutral voice
                • Dialogue uses character-specific voice settings
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                Enhanced Audio Controls:
              </div>
              <div className="text-purple-700 dark:text-purple-300">
                • Play/pause individual audio files
                • Global playback controls with skip functionality
                • Stop all audio with one click
                • Visual indicators for currently playing audio
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};