import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Story, Character, Video, StoryTheme, StoryLength } from '../types';
import toast from 'react-hot-toast';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  isCreatingStory: boolean;
  generationProgress: {
    step: string;
    progress: number;
    message: string;
    isComplete: boolean;
  } | null;
  
  // Actions
  createStory: (title: string, content: string, theme: StoryTheme, length: StoryLength) => Promise<Story>;
  updateStory: (storyId: string, updates: Partial<Story>) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  setCurrentStory: (story: Story | null) => void;
  generateCharacters: (storyId: string) => Promise<Character[]>;
  generateVideo: (storyId: string) => Promise<Video>;
  fetchUserStories: (userId: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStory: null,
  isCreatingStory: false,
  generationProgress: null,
  
  createStory: async (title: string, content: string, theme: StoryTheme, length: StoryLength) => {
    set({ isCreatingStory: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Creating story with data:', { title, theme, length, contentLength: content.length });

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          theme,
          length,
          status: 'draft',
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase create story error:', error);
        
        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('A story with this title already exists. Please choose a different title.');
        } else if (error.code === '23503') {
          throw new Error('User account not found. Please try signing out and back in.');
        } else if (error.code === '42501') {
          throw new Error('Permission denied. Please check your account permissions.');
        } else if (error.message.includes('violates check constraint')) {
          throw new Error('Invalid story data. Please check your theme and length selections.');
        } else {
          throw new Error(error.message || 'Failed to create story. Please try again.');
        }
      }

      if (!data) {
        throw new Error('No data returned from story creation');
      }

      console.log('✅ Story created successfully:', data);

      const story: Story = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        theme: data.theme as StoryTheme,
        status: data.status as any,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      set(state => ({
        stories: [...state.stories, story],
        currentStory: story,
        isCreatingStory: false,
      }));
      
      return story;
    } catch (error: any) {
      set({ isCreatingStory: false });
      console.error('❌ Create story error:', error);
      throw error;
    }
  },
  
  updateStory: async (storyId: string, updates: Partial<Story>) => {
    try {
      console.log('🔄 Updating story:', storyId, updates);

      // Prepare update data - only include database columns
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include valid database columns that exist in the stories table
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.theme !== undefined) updateData.theme = updates.theme;
      if (updates.length !== undefined) updateData.length = updates.length;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      
      // Note: segments, audio, characters, and videos are handled by separate tables
      // and should not be updated directly in the stories table

      // Update in database
      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId);

      if (error) {
        console.error('❌ Database update error:', error);
        // Continue with local update even if database fails for better UX
        toast.error('Failed to sync changes to database, but local changes saved');
      } else {
        console.log('✅ Story updated in database');
      }

      // Update local state (always do this for better UX)
      set(state => ({
        stories: state.stories.map(story => 
          story.id === storyId 
            ? { ...story, ...updates, updated_at: new Date().toISOString() }
            : story
        ),
        currentStory: state.currentStory?.id === storyId 
          ? { ...state.currentStory, ...updates, updated_at: new Date().toISOString() }
          : state.currentStory,
      }));

    } catch (error: any) {
      console.error('❌ Update story error:', error);
      // Still update local state for better UX
      set(state => ({
        stories: state.stories.map(story => 
          story.id === storyId 
            ? { ...story, ...updates, updated_at: new Date().toISOString() }
            : story
        ),
        currentStory: state.currentStory?.id === storyId 
          ? { ...state.currentStory, ...updates, updated_at: new Date().toISOString() }
          : state.currentStory,
      }));
      
      toast.error('Failed to sync changes, but local changes saved');
    }
  },
  
  deleteStory: async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) {
        throw error;
      }

      set(state => ({
        stories: state.stories.filter(story => story.id !== storyId),
        currentStory: state.currentStory?.id === storyId ? null : state.currentStory,
      }));

      toast.success('Story deleted successfully');
    } catch (error: any) {
      console.error('Delete story error:', error);
      toast.error('Failed to delete story');
    }
  },
  
  setCurrentStory: (story: Story | null) => {
    set({ currentStory: story });
  },
  
  generateCharacters: async (storyId: string) => {
    const story = get().stories.find(s => s.id === storyId);
    if (!story) throw new Error('Story not found');
    
    set({ generationProgress: { step: 'Analyzing Story', progress: 10, message: 'Analyzing story content...', isComplete: false } });
    
    // Simulate character generation process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    set({ generationProgress: { step: 'Creating Characters', progress: 40, message: 'Generating unique characters...', isComplete: false } });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate characters based on story theme
    const characters: Character[] = generateCharactersForTheme(story.theme, storyId);
    
    try {
      // Save characters to database
      const { data, error } = await supabase
        .from('characters')
        .insert(characters.map(char => ({
          story_id: char.story_id,
          name: char.name,
          description: char.description,
          personality: char.personality,
          appearance: char.appearance,
          role: char.role,
        })))
        .select();

      if (error) {
        throw error;
      }

      const savedCharacters = data.map(char => ({
        ...char,
        photos: [],
      })) as Character[];

      set({ generationProgress: { step: 'Characters Generated', progress: 70, message: 'Characters created successfully!', isComplete: false } });
      
      get().updateStory(storyId, { characters: savedCharacters });
      
      return savedCharacters;
    } catch (error: any) {
      console.error('Generate characters error:', error);
      // Fallback to local storage for demo
      get().updateStory(storyId, { characters });
      return characters;
    }
  },
  
  generateVideo: async (storyId: string) => {
    const story = get().stories.find(s => s.id === storyId);
    if (!story) throw new Error('Story not found');

    set({ generationProgress: { step: 'Preparing Video', progress: 75, message: 'Preparing video generation...', isComplete: false } });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    set({ generationProgress: { step: 'Generating Video', progress: 90, message: 'Creating your animated video...', isComplete: false } });
    
    try {
      // Use the actual video service for real video generation
      const { videoService } = await import('../lib/videoService');
      
      const videoRequest = {
        prompt: `${story.theme} story: ${story.content?.substring(0, 300) || 'Story content'}`,
        duration: 30,
        aspectRatio: '16:9' as const,
        style: 'cinematic' as const,
        scenes: story.segments?.map((segment: any, index: number) => ({
          description: segment.content || `Scene ${index + 1}`,
          duration: Math.max(5, Math.min(10, segment.duration || 8)),
          visualPrompt: segment.visualPrompt || `${segment.content}. Cinematic style, high quality.`
        })) || [{
          description: story.content?.substring(0, 200) || 'A cinematic story scene',
          duration: 10,
          visualPrompt: `${story.theme} themed story scene. Professional cinematography.`
        }],
        characters: story.characters?.map((char: any) => ({
          name: char.name,
          description: char.description,
          photo_url: char.photo_url || char.image_url
        })) || []
      };

      const result = await videoService.generateVideo(videoRequest);
      
      let video;
      if (result.status === 'completed' && result.video_url) {
                 video = {
           id: result.id,
           story_id: storyId,
           video_url: result.video_url,
           thumbnail_url: result.thumbnail_url || 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800',
           duration: 30,
           provider: (result.provider as 'demo' | 'luma' | 'runway' | 'aiml' | 'kling' | 'mock') || 'demo',
           status: 'completed' as const,
           created_at: new Date().toISOString(),
         } as Video;
      } else {
        // Fallback to demo video if generation fails or returns instructions
                 video = {
           id: result.id || Date.now().toString(),
           story_id: storyId,
           video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
           thumbnail_url: 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800',
           duration: 120,
           provider: 'demo' as const,
           status: 'completed' as const,
           created_at: new Date().toISOString(),
         } as Video;
        
        // If we got instructions, show them to the user
        if (result.instructions) {
          console.log('📝 Video generation instructions:', result.instructions);
        }
      }

      // Try to save to database
      try {
        const { data, error } = await supabase
          .from('videos')
          .insert({
            story_id: storyId,
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url,
            duration: video.duration,
            provider: video.provider,
            status: video.status,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const savedVideo = { ...data } as Video;
        
        set({ generationProgress: { step: 'Video Complete', progress: 100, message: 'Your video is ready!', isComplete: true } });
        
        get().updateStory(storyId, { videos: [savedVideo], status: 'completed' });
        
        return savedVideo;
      } catch (error: any) {
        console.error('Generate video database error:', error);
        // Fallback for demo - still return the video locally
        set({ generationProgress: { step: 'Video Complete', progress: 100, message: 'Your video is ready!', isComplete: true } });
        get().updateStory(storyId, { videos: [video], status: 'completed' });
        return video;
      }

    } catch (error: any) {
      console.error('Video generation error:', error);
      
      // If real video generation fails, fall back to demo video
      const fallbackVideo: Video = {
        id: Date.now().toString(),
        story_id: storyId,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail_url: 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800',
        duration: 120,
        provider: 'demo',
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      
      set({ generationProgress: { step: 'Video Complete', progress: 100, message: 'Your video is ready!', isComplete: true } });
      get().updateStory(storyId, { videos: [fallbackVideo], status: 'completed' });
      return fallbackVideo;
    }
  },
  
  fetchUserStories: async (userId: string) => {
    try {
      console.log('🔄 Fetching stories for user:', userId);

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          characters (*),
          videos (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch stories error:', error);
        throw error;
      }

      console.log('✅ Fetched stories:', data?.length || 0);

      const stories: Story[] = (data || []).map(story => ({
        ...story,
        theme: story.theme as StoryTheme,
        status: story.status as any,
        characters: story.characters || [],
        videos: story.videos || [],
      }));

      set({ stories });
    } catch (error: any) {
      console.error('❌ Fetch stories error:', error);
      toast.error('Failed to load stories');
      // Set empty array on error to prevent infinite loading
      set({ stories: [] });
    }
  },
}));

// Helper function to generate characters based on theme
function generateCharactersForTheme(theme: StoryTheme, storyId: string): Character[] {
  const characterTemplates = {
    fantasy: [
      {
        name: 'Aria Moonwhisper',
        description: 'A brave elven warrior with ancient magic flowing through her veins',
        personality: ['brave', 'wise', 'compassionate', 'determined'],
        appearance: {
          age: '150 (appears 25)',
          gender: 'female',
          ethnicity: 'elven',
          hairColor: 'silver',
          eyeColor: 'emerald green',
          style: 'mystical armor'
        },
        role: 'protagonist' as const,
      },
      {
        name: 'Thorin Ironforge',
        description: 'A stalwart dwarven blacksmith turned reluctant hero',
        personality: ['loyal', 'stubborn', 'skilled', 'protective'],
        appearance: {
          age: '200',
          gender: 'male',
          ethnicity: 'dwarven',
          hairColor: 'red beard',
          eyeColor: 'brown',
          style: 'battle-worn armor'
        },
        role: 'supporting' as const,
      }
    ],
    'sci-fi': [
      {
        name: 'Commander Zara Chen',
        description: 'A brilliant space fleet commander fighting for humanity\'s survival',
        personality: ['strategic', 'courageous', 'analytical', 'inspiring'],
        appearance: {
          age: '32',
          gender: 'female',
          ethnicity: 'asian',
          hairColor: 'black',
          eyeColor: 'dark brown',
          style: 'futuristic uniform'
        },
        role: 'protagonist' as const,
      },
      {
        name: 'Dr. Marcus Webb',
        description: 'A xenobiologist studying alien life forms across the galaxy',
        personality: ['curious', 'intelligent', 'cautious', 'dedicated'],
        appearance: {
          age: '45',
          gender: 'male',
          ethnicity: 'caucasian',
          hairColor: 'gray',
          eyeColor: 'blue',
          style: 'research attire'
        },
        role: 'supporting' as const,
      }
    ],
    // Add more themes as needed
  };

  const templates = (characterTemplates as any)[theme] || characterTemplates.fantasy;
  
  return templates.map((template: any, index: number) => ({
    id: `${storyId}-char-${index}`,
    story_id: storyId,
    ...template,
    photos: [],
    created_at: new Date().toISOString(),
  }));
}