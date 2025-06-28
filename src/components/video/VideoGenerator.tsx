import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Download, RefreshCw, AlertCircle, CheckCircle, Clock, Settings, Mic, Subtitles, ExternalLink, Key, Lightbulb, Zap, Star, Gift } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { videoService } from '../../lib/videoService';
import { elevenLabsService } from '../../lib/elevenlabsService';
import { tavusService } from '../../lib/tavusService';
import toast from 'react-hot-toast';

interface VideoGeneratorProps {
  storySegments: any[];
  characters: any[];
  onVideoGenerated: (video: any) => void;
}

interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  provider: string;
  video_url?: string;
  thumbnail_url?: string;
  estimated_time?: number;
  instructions?: string;
}

interface SegmentVideo {
  segmentId: string;
  segmentTitle: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  progress: number;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  storySegments,
  characters,
  onVideoGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [segmentVideos, setSegmentVideos] = useState<SegmentVideo[]>([]);
  const [generationMode, setGenerationMode] = useState<'single' | 'segments'>('single');
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [videoSettings, setVideoSettings] = useState({
    aspectRatio: '16:9' as '16:9' | '9:16' | '1:1',
    style: 'cinematic' as 'cinematic' | 'dramatic' | 'artistic' | 'realistic',
    includeNarration: true,
    includeSubtitles: true,
    voiceStyle: 'professional' as 'professional' | 'casual' | 'dramatic',
    duration: 30
  });

  useEffect(() => {
    const providers = videoService.getAvailableProviders();
    setAvailableProviders(providers);
    if (providers.length > 0) {
      // Prefer free providers first
      const freeProvider = providers.find(p => p.cost === 'free' || p.cost === 'freemium');
      const preferredProvider = freeProvider || providers[0];
      setSelectedProvider(preferredProvider.name);
    }
  }, []);

  const generateVideo = async () => {
    if (storySegments.length === 0) {
      toast.error('No story segments available for video generation');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus({
      id: '',
      status: 'pending',
      progress: 0,
      provider: selectedProvider
    });

    try {
      console.log('🎬 Starting enhanced video generation with character photos and premium audio...');
      
      // Enhanced video generation with character integration
      if (selectedProvider === 'tavus' && tavusService.isConfigured()) {
        const enhancedVideo = await generateEnhancedVideoWithTavus();
        onVideoGenerated(enhancedVideo);
        return;
      }
      
      // Generate professional narration first
      const audioData = await generateProfessionalAudio();
      
      const videoRequest = await buildEnhancedVideoRequest(audioData);
      const provider = availableProviders.find(p => p.name === selectedProvider);
      
      if (provider?.cost === 'free' || provider?.cost === 'freemium') {
        toast.success(`🎬 Generating video with ${selectedProvider.toUpperCase()} (${provider.cost})`);
      } else {
        toast.success(`🎬 Starting professional video generation with ${selectedProvider.toUpperCase()}`);
      }
      
      const result = await videoService.generateVideo(videoRequest);

      setGenerationStatus({
        ...result,
        progress: result.status === 'completed' ? 100 : 25
      });

      if (result.status === 'completed') {
        const video = {
          id: result.id,
          video_url: result.video_url,
          thumbnail_url: result.thumbnail_url,
          provider: result.provider,
          status: 'completed',
          created_at: new Date().toISOString(),
          metadata: {
            hasNarration: videoSettings.includeNarration,
            hasSubtitles: videoSettings.includeSubtitles,
            style: videoSettings.style,
            aspectRatio: videoSettings.aspectRatio,
            instructions: result.instructions,
            characterPhotos: characters.map(c => c.photo_url).filter(Boolean),
            audioSegments: audioData?.segments || []
          }
        };
        
        onVideoGenerated(video);
        
        if (result.instructions) {
          setShowInstructions(true);
          toast.success('🎉 Video generation guide ready! Check the instructions below.');
        } else {
          toast.success('🎉 Professional video with character photos and premium audio generated!');
        }
      } else {
        await pollVideoStatus(result.id, result.provider);
      }

    } catch (error: any) {
      console.error('❌ Video generation error:', error);
      toast.error(error.message || 'Video generation failed');
      setGenerationStatus({
        id: '',
        status: 'failed',
        progress: 0,
        provider: selectedProvider
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate enhanced video with Tavus conversational AI
  const generateEnhancedVideoWithTavus = async () => {
    try {
      console.log('🎭 Generating enhanced video with Tavus character agents...');
      
      // Create video agents for main characters
      const videoAgents = [];
      for (const character of characters.slice(0, 2)) { // Limit to 2 main characters
        const agent = await tavusService.createVideoAgent(character);
        videoAgents.push(agent);
      }
      
      // Generate character introduction videos
      const characterVideos = [];
      for (const agent of videoAgents) {
        const introText = `Hello! I'm ${agent.name}. ${agent.character?.description || ''} Let me tell you about our story...`;
        
        const conversationResult = await tavusService.generateConversationalVideo({
          message: introText,
          character: agent.id,
          context: `Story: ${storySegments.map(s => s.content).join(' ')}`,
          emotion: 'friendly'
        });
        
        characterVideos.push({
          character: agent.character?.name,
          video_url: conversationResult.video_url,
          audio_url: conversationResult.audio_url,
          transcript: conversationResult.transcript
        });
      }
      
      setGenerationStatus({
        id: 'tavus-enhanced',
        status: 'completed',
        progress: 100,
        provider: 'tavus'
      });
      
      toast.success(`🎭 Generated ${characterVideos.length} character videos with Tavus!`);
      
      return {
        id: 'tavus-enhanced-' + Date.now(),
        video_url: characterVideos[0]?.video_url || '',
        thumbnail_url: '',
        provider: 'tavus',
        status: 'completed',
        created_at: new Date().toISOString(),
        metadata: {
          hasNarration: true,
          hasSubtitles: videoSettings.includeSubtitles,
          style: 'conversational',
          aspectRatio: videoSettings.aspectRatio,
          characterVideos: characterVideos,
          type: 'character_introduction'
        }
      };
      
    } catch (error) {
      console.error('Tavus video generation failed:', error);
      throw error;
    }
  };

  // Generate professional audio with ElevenLabs
  const generateProfessionalAudio = async () => {
    if (!elevenLabsService.isConfigured()) {
      return null;
    }

    try {
      console.log('🎙️ Generating professional audio with ElevenLabs Creator Tier...');
      
      const storyText = storySegments.map(seg => seg.content).join('\n');
      const theme = storySegments[0]?.theme || videoSettings.style;
      
      // Generate character voices
      const characterVoices = await elevenLabsService.generateCharacterVoices(characters);
      
      // Generate story narration
      const narrationResult = await elevenLabsService.generateStoryNarration(
        storyText,
        theme,
        characterVoices
      );
      
      return narrationResult;
      
    } catch (error) {
      console.error('Professional audio generation failed:', error);
      return null;
    }
  };

  // Build enhanced video request with character photos and audio
  const buildEnhancedVideoRequest = async (audioData: any) => {
    const scenes = storySegments.map((segment, index) => ({
      description: segment.content,
      duration: Math.max(5, Math.min(10, segment.duration || 8)),
      narration: audioData?.segments?.[index]?.audioUrl || undefined,
      dialogue: extractDialogueFromSegment(segment),
      visualPrompt: `${segment.content}. ${videoSettings.style} cinematography with character photos.`,
      characterPhotos: characters.map(char => ({
        name: char.name,
        photo_url: char.photo_url || char.image_url,
        description: char.description
      })).filter(char => char.photo_url)
    }));

    return {
      prompt: createEnhancedMasterPrompt(),
      duration: videoSettings.duration,
      aspectRatio: videoSettings.aspectRatio,
      style: videoSettings.style,
      narration: audioData ? {
        audio_url: audioData.audioUrl,
        segments: audioData.segments,
        voice_style: videoSettings.voiceStyle
      } : undefined,
      subtitles: videoSettings.includeSubtitles,
      characters: characters.map(char => ({
        name: char.name,
        description: char.description,
        photo_url: char.photo_url || char.image_url,
        voice: char.voice || 'default'
      })),
      scenes: scenes,
      enhanced_features: {
        character_photos: true,
        premium_audio: !!audioData,
        synchronized_timing: true
      }
    };
  };

  const createEnhancedMasterPrompt = (): string => {
    const storyTheme = storySegments[0]?.theme || videoSettings.style;
    const characterList = characters.map(char => 
      `${char.name} (${char.role}): ${char.description}${char.photo_url ? ' [Photo provided]' : ''}`
    ).join('. ');

    const sceneDescriptions = storySegments.map((segment, index) => 
      `Scene ${index + 1}: ${segment.content.substring(0, 150)}...`
    ).join(' ');

    return `Professional ${storyTheme} story video with character photos and premium audio narration. 
    Characters with photos: ${characterList}. 
    Story progression: ${sceneDescriptions}. 
    Style: ${videoSettings.style} cinematography with smooth transitions, 
    character photo integration, professional lighting, engaging visual storytelling, 
    high production value, ${videoSettings.aspectRatio} aspect ratio, 
    synchronized audio timing, broadcast quality with character appearances.`;
  };

  const buildVideoRequest = async () => {
    const scenes = storySegments.map((segment, index) => ({
      description: segment.content,
      duration: Math.max(5, Math.min(10, segment.duration || 8)),
      narration: videoSettings.includeNarration ? segment.content.substring(0, 200) : undefined,
      dialogue: extractDialogueFromSegment(segment),
      visualPrompt: segment.visualPrompt || `${segment.content}. ${videoSettings.style} cinematography, professional lighting, high quality.`
    }));

    return {
      prompt: createMasterPrompt(),
      duration: videoSettings.duration,
      aspectRatio: videoSettings.aspectRatio,
      style: videoSettings.style,
      narration: videoSettings.includeNarration ? {
        text: scenes.map(s => s.narration).filter(Boolean).join(' '),
        voice: videoSettings.voiceStyle
      } : undefined,
      subtitles: videoSettings.includeSubtitles,
      characters: characters.map(char => ({
        name: char.name,
        description: char.description,
        voice: char.voice || 'default'
      })),
      scenes: scenes
    };
  };

  const createMasterPrompt = (): string => {
    const storyTheme = storySegments[0]?.theme || 'adventure';
    const characterList = characters.map(char => 
      `${char.name} (${char.role}): ${char.description}`
    ).join('. ');

    const sceneDescriptions = storySegments.map((segment, index) => 
      `Scene ${index + 1}: ${segment.content.substring(0, 150)}...`
    ).join(' ');

    return `Professional ${storyTheme} story video. Characters: ${characterList}. 
    Story progression: ${sceneDescriptions}. 
    Style: ${videoSettings.style} cinematography with smooth transitions, 
    professional lighting, engaging visual storytelling, high production value, 
    ${videoSettings.aspectRatio} aspect ratio, broadcast quality.`;
  };

  const extractDialogueFromSegment = (segment: any) => {
    const dialogue = [];
    const lines = segment.content.split('\n');
    
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

  const pollVideoStatus = async (id: string, provider: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await videoService.checkVideoStatus(id, provider);
        
        setGenerationStatus(prev => ({
          ...prev!,
          ...status,
          progress: Math.min(95, 25 + (attempts / maxAttempts) * 70)
        }));

        if (status.status === 'completed') {
          setGenerationStatus(prev => ({
            ...prev!,
            progress: 100
          }));
          
          const video = {
            id: status.id,
            video_url: status.video_url,
            provider: status.provider,
            status: 'completed',
            created_at: new Date().toISOString(),
            metadata: {
              hasNarration: videoSettings.includeNarration,
              hasSubtitles: videoSettings.includeSubtitles,
              style: videoSettings.style,
              aspectRatio: videoSettings.aspectRatio
            }
          };
          
          onVideoGenerated(video);
          toast.success('🎉 Video generated successfully!');
          return;
        } else if (status.status === 'failed') {
          throw new Error('Video generation failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          throw new Error('Video generation timeout');
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        toast.error(error.message || 'Video generation failed');
        setGenerationStatus(prev => ({
          ...prev!,
          status: 'failed'
        }));
      }
    };

    poll();
  };

  const getStatusIcon = () => {
    if (!generationStatus) return <Video className="w-5 h-5" />;
    
    switch (generationStatus.status) {
      case 'pending':
      case 'processing':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getStatusMessage = () => {
    if (!generationStatus) return 'Ready to generate video';
    
    const provider = availableProviders.find(p => p.name === generationStatus.provider);
    const isFree = provider?.cost === 'free' || provider?.cost === 'freemium';
    
    switch (generationStatus.status) {
      case 'pending':
        return isFree ? 'Preparing free video generation...' : 'Initializing professional video generation...';
      case 'processing':
        return isFree ? `Creating video with ${generationStatus.provider.toUpperCase()} (Free)...` : `Creating video with ${generationStatus.provider.toUpperCase()}...`;
      case 'completed':
        return isFree ? 'Free video generated! Upgrade for premium features.' : 'Professional video generated successfully!';
      case 'failed':
        return 'Video generation failed. Please try again.';
      default:
        return 'Ready to generate video';
    }
  };

  const getProviderDescription = (providerName: string) => {
    const descriptions = {
      kapwing: 'Free script-to-video with AI narration and subtitles (3 videos/month)',
      krikey: 'Free character animation with motion capture (5 minutes/month)',
      'canva-video': 'Free video templates with animations (720p quality)',
      shotstack: 'Professional video editing API with premium features',
      runway: 'AI-powered text-to-video generation (premium quality)',
      demo: 'Demo video generation (no limits)'
    };
    return descriptions[providerName] || 'Video generation service';
  };

  const getProviderCostBadge = (provider: any) => {
    const badges = {
      free: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Gift, text: 'FREE' },
      freemium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Zap, text: 'FREEMIUM' },
      paid: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Star, text: 'PREMIUM' }
    };
    
    const badge = badges[provider.cost] || badges.free;
    const Icon = badge.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        <span>{badge.text}</span>
      </div>
    );
  };

  const getFreeProviderCount = () => {
    return availableProviders.filter(p => p.cost === 'free' || p.cost === 'freemium').length;
  };

  return (
    <div className="space-y-6">
      {/* Free Tools Highlight */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Free AI Video Generation Available!
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white dark:bg-green-800 rounded-lg">
              <Zap className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-800 dark:text-green-200">Kapwing</div>
              <div className="text-xs text-green-600 dark:text-green-300">3 free videos/month</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-green-800 rounded-lg">
              <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-800 dark:text-green-200">Krikey AI</div>
              <div className="text-xs text-green-600 dark:text-green-300">5 minutes/month</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-green-800 rounded-lg">
              <Gift className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-800 dark:text-green-200">Canva Video</div>
              <div className="text-xs text-green-600 dark:text-green-300">720p quality</div>
            </div>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            🎉 <strong>{getFreeProviderCount()} free tools</strong> available! Start creating videos immediately with no cost. 
            Upgrade to premium providers later for higher quality and unlimited usage.
          </p>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Video Generation Provider
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Your Video Generation Tool
            </label>
            <div className="grid grid-cols-1 gap-3">
              {availableProviders.map(provider => (
                <div
                  key={provider.name}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProvider === provider.name
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedProvider(provider.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {provider.name.replace('-', ' ')}
                        </div>
                        {getProviderCostBadge(provider)}
                        {!provider.configured && provider.cost === 'paid' && (
                          <div className="text-xs text-gray-500">(Not configured)</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {getProviderDescription(provider.name)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {provider.capabilities.map((cap, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {cap.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedProvider === provider.name
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Mode */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Video Generation Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  generationMode === 'single' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setGenerationMode('single')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    generationMode === 'single'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Single Video</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Generate one complete video for the entire story
                    </div>
                  </div>
                </div>
              </div>
              
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  generationMode === 'segments' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setGenerationMode('segments')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    generationMode === 'segments'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">Segmented Videos</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Generate separate videos for each scene ({storySegments.length} segments)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                value={videoSettings.aspectRatio}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                disabled={isGenerating}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="16:9">16:9 (Landscape/YouTube)</option>
                <option value="9:16">9:16 (Portrait/TikTok)</option>
                <option value="1:1">1:1 (Square/Instagram)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visual Style
              </label>
              <select
                value={videoSettings.style}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, style: e.target.value as any }))}
                disabled={isGenerating}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="cinematic">Cinematic (Movie-style)</option>
                <option value="dramatic">Dramatic (High contrast)</option>
                <option value="artistic">Artistic (Creative style)</option>
                <option value="realistic">Realistic (Natural look)</option>
              </select>
            </div>
          </div>

          {/* Audio & Subtitle Settings */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeNarration"
                checked={videoSettings.includeNarration}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, includeNarration: e.target.checked }))}
                disabled={isGenerating}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="includeNarration" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mic className="w-4 h-4" />
                <span>Include AI Narration</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeSubtitles"
                checked={videoSettings.includeSubtitles}
                onChange={(e) => setVideoSettings(prev => ({ ...prev, includeSubtitles: e.target.checked }))}
                disabled={isGenerating}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="includeSubtitles" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Subtitles className="w-4 h-4" />
                <span>Include Subtitles</span>
              </label>
            </div>
          </div>

          {/* Project Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Scenes</div>
              <div className="text-gray-600 dark:text-gray-400">{storySegments.length}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Characters</div>
              <div className="text-gray-600 dark:text-gray-400">{characters.length}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Duration</div>
              <div className="text-gray-600 dark:text-gray-400">{videoSettings.duration}s</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Cost</div>
              <div className="text-gray-600 dark:text-gray-400">
                {availableProviders.find(p => p.name === selectedProvider)?.cost === 'free' ? 'FREE' : 
                 availableProviders.find(p => p.name === selectedProvider)?.cost === 'freemium' ? 'FREEMIUM' : 'PREMIUM'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Status */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Video Generation
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              {getStatusMessage()}
            </p>

            {generationStatus && generationStatus.status !== 'failed' && (
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${generationStatus.progress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {generationStatus.progress}% complete
                </div>
              </div>
            )}

            {generationStatus?.status === 'completed' && generationStatus.video_url && (
              <div className="space-y-4">
                <video
                  controls
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                  poster={generationStatus.thumbnail_url || "https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800"}
                >
                  <source src={generationStatus.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {generationStatus.instructions && (
                    <Button variant="outline" size="sm" onClick={() => setShowInstructions(!showInstructions)}>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Instructions
                    </Button>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>✅ Generated with {generationStatus.provider.toUpperCase()}</div>
                  {videoSettings.includeNarration && <div>✅ AI narration included</div>}
                  {videoSettings.includeSubtitles && <div>✅ Subtitles included</div>}
                  <div>✅ {videoSettings.aspectRatio} aspect ratio</div>
                </div>
              </div>
            )}

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !selectedProvider}
              isLoading={isGenerating}
              size="lg"
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating Video...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>{generationMode === 'segments' ? `Generate ${storySegments.length} Videos` : 'Generate Video'}</span>
                </div>
              )}
            </Button>

            {/* Debug: Test Tavus Button */}
            {import.meta.env.DEV && (
              <Button
                onClick={async () => {
                  try {
                    const { tavusService } = await import('../../lib/tavusService');
                    const isConfigured = tavusService.isConfigured();
                    console.log('🎬 Tavus configured:', isConfigured);
                    
                    if (isConfigured && characters.length > 0) {
                      const testCharacter = characters[0];
                      console.log('🎭 Testing with character:', testCharacter.name);
                      
                      const agent = await tavusService.createVideoAgent(testCharacter);
                      console.log('✅ Agent created:', agent);
                      
                      toast.success(`✅ Tavus test successful! Agent ID: ${agent.replica_id}`);
                    } else {
                      toast.error('❌ Tavus not configured or no characters available');
                    }
                  } catch (error) {
                    console.error('❌ Tavus test failed:', error);
                    toast.error(`❌ Tavus test failed: ${error.message}`);
                  }
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                🧪 Test Tavus Connection
              </Button>
            )}

            {selectedProvider && availableProviders.find(p => p.name === selectedProvider)?.cost === 'freemium' && (
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Using free tier of {selectedProvider.replace('-', ' ')}. Upgrade for unlimited usage and premium features.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Modal */}
      {showInstructions && generationStatus?.instructions && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Video Generation Instructions
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200">
              <pre className="whitespace-pre-wrap text-sm bg-white dark:bg-blue-800 p-4 rounded-lg">
                {generationStatus.instructions}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            🚀 Free Video Generation Workflow:
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                1. Start with Free Tools (No Cost):
              </div>
              <div className="space-y-1 text-green-700 dark:text-green-300">
                <div>• <strong>Kapwing:</strong> Free script-to-video with AI narration (3 videos/month)</div>
                <div>• <strong>Krikey AI:</strong> Free character animation with motion capture (5 min/month)</div>
                <div>• <strong>Canva Video:</strong> Free templates with animations (720p quality)</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                2. Upgrade When Ready (Premium Quality):
              </div>
              <div className="space-y-1 text-blue-700 dark:text-blue-300">
                <div>• <strong>Shotstack:</strong> Professional video editing API</div>
                <div>• <strong>Runway ML:</strong> AI-powered text-to-video generation</div>
                <div>• Add API keys to your .env file for automatic integration</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                3. Workflow Integration:
              </div>
              <div className="text-purple-700 dark:text-purple-300">
                <div>• Generate story and characters in Animato</div>
                <div>• Export to your chosen video generation tool</div>
                <div>• Follow the provided instructions for each platform</div>
                <div>• Upload finished videos back to your dashboard</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => window.open('https://kapwing.com', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Kapwing
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('https://krikey.ai', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Krikey AI
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('https://canva.com', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Canva
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};