/*
  # Complete Animato Database Schema - Safe Migration

  1. New Tables
    - `users` - User profiles (extends Supabase auth.users)
    - `stories` - User stories with content and metadata
    - `characters` - Character profiles extracted from stories
    - `character_photos` - AI-generated character photos
    - `videos` - Generated videos for stories
    - `video_segments` - Individual video segments
    - `audio_files` - Generated audio/voiceovers

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Features
    - Full-text search on stories
    - Automatic timestamps
    - JSON fields for flexible metadata storage
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  credits_remaining integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  theme text NOT NULL CHECK (theme IN ('fantasy', 'sci-fi', 'romance', 'adventure', 'mystery', 'comedy', 'drama', 'horror')),
  length text DEFAULT 'medium' CHECK (length IN ('short', 'medium', 'long')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  word_count integer GENERATED ALWAYS AS (array_length(string_to_array(content, ' '), 1)) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  personality text[] DEFAULT '{}',
  appearance jsonb DEFAULT '{}',
  role text NOT NULL CHECK (role IN ('protagonist', 'antagonist', 'supporting')),
  dialogue_lines text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Character photos table
CREATE TABLE IF NOT EXISTS character_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  provider text NOT NULL DEFAULT 'replicate',
  style text DEFAULT 'realistic',
  is_selected boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  video_url text,
  thumbnail_url text,
  duration integer, -- in seconds
  provider text NOT NULL DEFAULT 'runway',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Video segments table
CREATE TABLE IF NOT EXISTS video_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  segment_order integer NOT NULL,
  prompt text NOT NULL,
  character_id uuid REFERENCES characters(id),
  video_url text,
  duration integer DEFAULT 5,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  text_content text NOT NULL,
  voice_id text,
  provider text NOT NULL DEFAULT 'elevenlabs',
  duration integer, -- in seconds
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$ 
BEGIN
  -- Users policies
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
  DROP POLICY IF EXISTS "Allow insert for matching user ID" ON users;
  DROP POLICY IF EXISTS "Allow insert for user with matching ID" ON users;
  DROP POLICY IF EXISTS "Allow select for user" ON users;
  DROP POLICY IF EXISTS "Allow update for user" ON users;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;

  -- Stories policies
  DROP POLICY IF EXISTS "Users can read own stories" ON stories;
  DROP POLICY IF EXISTS "Users can create own stories" ON stories;
  DROP POLICY IF EXISTS "Users can update own stories" ON stories;
  DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

  -- Characters policies
  DROP POLICY IF EXISTS "Users can read characters from own stories" ON characters;
  DROP POLICY IF EXISTS "Users can create characters for own stories" ON characters;
  DROP POLICY IF EXISTS "Users can update characters from own stories" ON characters;
  DROP POLICY IF EXISTS "Users can delete characters from own stories" ON characters;

  -- Character photos policies
  DROP POLICY IF EXISTS "Users can read photos from own characters" ON character_photos;
  DROP POLICY IF EXISTS "Users can create photos for own characters" ON character_photos;
  DROP POLICY IF EXISTS "Users can update photos from own characters" ON character_photos;
  DROP POLICY IF EXISTS "Users can delete photos from own characters" ON character_photos;

  -- Videos policies
  DROP POLICY IF EXISTS "Users can read videos from own stories" ON videos;
  DROP POLICY IF EXISTS "Users can create videos for own stories" ON videos;
  DROP POLICY IF EXISTS "Users can update videos from own stories" ON videos;

  -- Video segments policies
  DROP POLICY IF EXISTS "Users can read segments from own videos" ON video_segments;
  DROP POLICY IF EXISTS "Users can create segments for own videos" ON video_segments;

  -- Audio files policies
  DROP POLICY IF EXISTS "Users can read audio from own stories" ON audio_files;
  DROP POLICY IF EXISTS "Users can create audio for own stories" ON audio_files;
END $$;

-- Create new policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Stories policies
CREATE POLICY "Users can read own stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Characters policies
CREATE POLICY "Users can read characters from own stories"
  ON characters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create characters for own stories"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update characters from own stories"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete characters from own stories"
  ON characters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Character photos policies
CREATE POLICY "Users can read photos from own characters"
  ON character_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters 
      JOIN stories ON stories.id = characters.story_id
      WHERE characters.id = character_photos.character_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create photos for own characters"
  ON character_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters 
      JOIN stories ON stories.id = characters.story_id
      WHERE characters.id = character_photos.character_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos from own characters"
  ON character_photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters 
      JOIN stories ON stories.id = characters.story_id
      WHERE characters.id = character_photos.character_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from own characters"
  ON character_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters 
      JOIN stories ON stories.id = characters.story_id
      WHERE characters.id = character_photos.character_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Videos policies
CREATE POLICY "Users can read videos from own stories"
  ON videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = videos.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create videos for own stories"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = videos.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update videos from own stories"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = videos.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Video segments policies
CREATE POLICY "Users can read segments from own videos"
  ON video_segments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM videos 
      JOIN stories ON stories.id = videos.story_id
      WHERE videos.id = video_segments.video_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create segments for own videos"
  ON video_segments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos 
      JOIN stories ON stories.id = videos.story_id
      WHERE videos.id = video_segments.video_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Audio files policies
CREATE POLICY "Users can read audio from own stories"
  ON audio_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = audio_files.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create audio for own stories"
  ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = audio_files.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_theme ON stories(theme);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_story_id ON characters(story_id);
CREATE INDEX IF NOT EXISTS idx_character_photos_character_id ON character_photos(character_id);
CREATE INDEX IF NOT EXISTS idx_videos_story_id ON videos(story_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_video_id ON video_segments(video_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_story_id ON audio_files(story_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_stories_content_search ON stories USING gin(to_tsvector('english', title || ' ' || content));

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamps (safe to recreate)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation (safe to recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();