export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  content: string;
  theme: StoryTheme;
  length?: StoryLength;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  characters?: Character[];
  videos?: Video[];
  segments?: StorySegment[];
  audio?: AudioFile[];
  metadata?: Record<string, any>;
}

export type StoryTheme = 
  | 'fantasy' 
  | 'sci-fi' 
  | 'romance' 
  | 'adventure' 
  | 'mystery' 
  | 'comedy' 
  | 'drama' 
  | 'horror';

export type StoryLength = 'short' | 'medium' | 'long';

export interface Character {
  id: string;
  story_id: string;
  name: string;
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
  role: 'protagonist' | 'antagonist' | 'supporting';
  photos: CharacterPhoto[];
  created_at: string;
}

export interface CharacterPhoto {
  id: string;
  character_id: string;
  photo_url: string;
  is_selected: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  story_id: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  provider: 'luma' | 'runway' | 'aiml' | 'kling' | 'mock' | 'demo';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  segments?: VideoSegment[];
}

export interface VideoSegment {
  id: string;
  video_id: string;
  segment_order: number;
  prompt: string;
  character_id?: string;
  video_url?: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface VideoGenerationOptions {
  provider: 'luma' | 'runway' | 'aiml' | 'kling';
  style: 'cinematic' | 'dramatic' | 'artistic' | 'realistic';
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
  isComplete: boolean;
}

export interface StorySegment {
  id: string;
  story_id: string;
  segment_order: number;
  content: string;
  character_id?: string;
  duration?: number;
}

export interface AudioFile {
  id: string;
  story_id: string;
  character_id?: string;
  audio_url: string;
  duration?: number;
}