import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Validate URL format (more lenient for development)
if (supabaseUrl && (supabaseUrl.includes('your-project-id') || supabaseUrl.length < 10)) {
  console.error('Invalid Supabase URL. Please set VITE_SUPABASE_URL to your actual Supabase project URL');
}

// Validate anon key format (more lenient for development)
if (supabaseAnonKey && (supabaseAnonKey.includes('your-anon-key') || supabaseAnonKey.length < 50)) {
  console.error('Invalid Supabase anon key. Please set VITE_SUPABASE_ANON_KEY to your actual Supabase anon key');
}

// Create client with fallback for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'animato-platform'
      }
    }
  }
);

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error.message);
    console.log('Please check your Supabase configuration in the .env file');
  } else {
    console.log('Supabase connected successfully');
  }
}).catch(err => {
  console.error('Supabase initialization error:', err);
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          theme: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          theme: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          theme?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          story_id: string;
          name: string;
          description: string;
          personality: string[];
          appearance: Record<string, any>;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          name: string;
          description: string;
          personality: string[];
          appearance: Record<string, any>;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          name?: string;
          description?: string;
          personality?: string[];
          appearance?: Record<string, any>;
          role?: string;
          created_at?: string;
        };
      };
      character_photos: {
        Row: {
          id: string;
          character_id: string;
          photo_url: string;
          is_selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          photo_url: string;
          is_selected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          photo_url?: string;
          is_selected?: boolean;
          created_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          story_id: string;
          video_url: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          provider: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          provider: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          provider?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
}