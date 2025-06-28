import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  createDemoAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    set({ isLoading: true });
    try {
      console.log('🔐 Attempting login with:', email);
      
      // Check if this is demo account and create if needed
      if (email.toLowerCase() === 'demo@animato.com' && password === 'demo123') {
        console.log('🎭 Demo account detected, ensuring it exists...');
        try {
          await get().createDemoAccount();
        } catch (createError: any) {
          console.log('Demo account may already exist, continuing with login...');
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        console.error('❌ Supabase login error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('Invalid login credentials')) {
          if (email.toLowerCase() === 'demo@animato.com') {
            throw new Error('Demo account not found. Please try creating a new account or contact support.');
          }
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed') || 
                   error.message.includes('email_not_confirmed') ||
                   error.code === 'email_not_confirmed') {
          // Enhanced email confirmation error handling
          if (email.toLowerCase() === 'demo@animato.com') {
            throw new Error('Demo account requires email confirmation to be disabled in Supabase settings. Please disable email confirmation in your Supabase project (Authentication → Settings → Email Confirm) to use the demo account.');
          } else {
            throw new Error('Email confirmation required. Please check your email for a confirmation link, or disable email confirmation in your Supabase project settings (Authentication → Settings → Email Confirm) for immediate access.');
          }
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error('Sign-in is currently disabled. Please contact support.');
        } else {
          throw new Error(error.message || 'Login failed. Please try again.');
        }
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email);
        
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
        toast.success(`Welcome back, ${data.user.email}!`);
      } else {
        throw new Error('Login failed. No user data received.');
      }
    } catch (error: any) {
      set({ isLoading: false });
      console.error('❌ Login error:', error);
      throw error;
    }
  },
  
  signup: async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    set({ isLoading: true });
    try {
      console.log('📝 Attempting signup with:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ Supabase signup error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please try signing in instead.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long');
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error('Account creation is currently disabled. Please contact support.');
        } else {
          throw new Error(error.message || 'Account creation failed. Please try again.');
        }
      }

      if (data.user) {
        console.log('✅ Signup successful:', data.user.email);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          // User created but no session means email confirmation is required
          set({ isLoading: false });
          toast.success('Account created! Please check your email for a confirmation link, or disable email confirmation in Supabase settings for immediate access.');
          throw new Error('Account created successfully! Please check your email for a confirmation link before signing in. Alternatively, you can disable email confirmation in your Supabase project settings (Authentication → Settings → Email Confirm) for immediate access.');
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
        toast.success(`Account created successfully! Welcome to Animato, ${data.user.email}!`);
      } else {
        throw new Error('Account creation failed. Please try again.');
      }
    } catch (error: any) {
      set({ isLoading: false });
      console.error('❌ Signup error:', error);
      throw error;
    }
  },

  createDemoAccount: async () => {
    try {
      console.log('🎭 Creating demo account...');
      
      const { data, error } = await supabase.auth.signUp({
        email: 'demo@animato.com',
        password: 'demo123',
        options: {
          data: {
            full_name: 'Demo User'
          }
        },
      });

      if (error) {
        console.error('❌ Demo account creation error:', error);
        if (error.message.includes('User already registered')) {
          console.log('✅ Demo account already exists');
          return;
        }
        throw error;
      }

      console.log('✅ Demo account created successfully');
    } catch (error: any) {
      console.error('❌ Demo account creation failed:', error);
      // Don't throw error if account already exists
      if (!error.message?.includes('User already registered')) {
        throw error;
      }
    }
  },
  
  logout: async () => {
    try {
      console.log('🚪 Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      set({ user: null, isAuthenticated: false });
      console.log('✅ Logged out successfully');
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out');
    }
  },
  
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  checkAuth: async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        set({ user: null, isAuthenticated: false });
        return;
      }
      
      if (session?.user) {
        console.log('✅ User is authenticated:', session.user.email);

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        };
        set({ user, isAuthenticated: true });
      } else {
        console.log('❌ No authenticated user found');
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser } = useAuthStore.getState();
  
  console.log('🔄 Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN' && session?.user) {
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      created_at: session.user.created_at,
    };
    setUser(user);
  } else if (event === 'SIGNED_OUT') {
    setUser(null);
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      created_at: session.user.created_at,
    };
    setUser(user);
  }
});